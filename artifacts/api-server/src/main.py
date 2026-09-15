from __future__ import annotations

import logging
import os
from contextlib import contextmanager
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Iterator
from urllib.parse import unquote, urlparse

import mysql.connector
from flask import Flask, jsonify, request
from mysql.connector import Error, IntegrityError
from mysql.connector.connection import MySQLConnection
from mysql.connector.cursor import MySQLCursorDict


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("electrotrees-api")

app = Flask(__name__)


@app.after_request
def add_cors_headers(response: Any) -> Any:
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
    return response


def connection_config() -> dict[str, Any]:
    raw = os.environ.get("MYSQL_DATABASE_URL")
    if not raw:
        raise RuntimeError("MYSQL_DATABASE_URL is not configured")
    parsed = urlparse(raw)
    if parsed.scheme not in {"mysql", "mysql+mysqlconnector"}:
        raise RuntimeError("MYSQL_DATABASE_URL must use the mysql:// scheme")
    if not parsed.hostname or not parsed.path.strip("/"):
        raise RuntimeError("MYSQL_DATABASE_URL must include host and database name")
    return {
        "host": parsed.hostname,
        "port": parsed.port or 3306,
        "user": unquote(parsed.username or ""),
        "password": unquote(parsed.password or ""),
        "database": parsed.path.strip("/"),
        "connection_timeout": 8,
    }


@contextmanager
def db_cursor() -> Iterator[tuple[MySQLConnection, MySQLCursorDict]]:
    connection = mysql.connector.connect(**connection_config())
    cursor = connection.cursor(dictionary=True)
    try:
        yield connection, cursor
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()


def json_value(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def clean_row(row: dict[str, Any]) -> dict[str, Any]:
    return {key: json_value(value) for key, value in row.items()}


def rows(cursor: MySQLCursorDict) -> list[dict[str, Any]]:
    return [clean_row(row) for row in cursor.fetchall()]


def one(cursor: MySQLCursorDict) -> dict[str, Any] | None:
    row = cursor.fetchone()
    return clean_row(row) if row else None


def body() -> dict[str, Any]:
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else {}


def as_int(value: Any, field: str) -> int:
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field} must be an integer") from exc


def as_float(value: Any, field: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field} must be a number") from exc


def required_text(payload: dict[str, Any], field: str) -> str:
    value = payload.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} is required")
    return value.strip()


SCHEMA_STATEMENTS = (
    """
    CREATE TABLE IF NOT EXISTS BranchTypes (
      BranchTypeID BIGINT NOT NULL AUTO_INCREMENT,
      BranchTypeDescr TEXT NOT NULL,
      PRIMARY KEY (BranchTypeID)
    ) ENGINE=InnoDB
    """,
    """
    CREATE TABLE IF NOT EXISTS Points (
      PointID BIGINT NOT NULL AUTO_INCREMENT,
      PointCoordX DECIMAL(18,6) NOT NULL,
      PointCoordY DECIMAL(18,6) NOT NULL,
      PRIMARY KEY (PointID)
    ) ENGINE=InnoDB
    """,
    """
    CREATE TABLE IF NOT EXISTS Nodes (
      NodeID BIGINT NOT NULL AUTO_INCREMENT,
      NodeName TEXT NOT NULL,
      PointID BIGINT NOT NULL,
      PRIMARY KEY (NodeID),
      UNIQUE KEY unq_Nodes_PointID (PointID),
      CONSTRAINT fk_Nodes_Points FOREIGN KEY (PointID) REFERENCES Points(PointID)
    ) ENGINE=InnoDB
    """,
    """
    CREATE TABLE IF NOT EXISTS Branches (
      BranchID BIGINT NOT NULL AUTO_INCREMENT,
      BranchName TEXT NOT NULL,
      BranchBeginNode BIGINT NOT NULL,
      BranchEndNode BIGINT NOT NULL,
      BranchTypeID BIGINT NOT NULL,
      PRIMARY KEY (BranchID),
      KEY idx_Branches_BeginNode (BranchBeginNode),
      KEY idx_Branches_EndNode (BranchEndNode),
      KEY idx_Branches_BranchTypeID (BranchTypeID),
      CONSTRAINT fk_Branches_BeginNode FOREIGN KEY (BranchBeginNode) REFERENCES Nodes(NodeID),
      CONSTRAINT fk_Branches_EndNode FOREIGN KEY (BranchEndNode) REFERENCES Nodes(NodeID),
      CONSTRAINT fk_Branches_BranchType FOREIGN KEY (BranchTypeID) REFERENCES BranchTypes(BranchTypeID)
    ) ENGINE=InnoDB
    """,
    """
    CREATE TABLE IF NOT EXISTS TracePoint (
      PointOrder INT NOT NULL,
      BranchID BIGINT NOT NULL,
      PointID BIGINT NOT NULL,
      PRIMARY KEY (BranchID, PointOrder),
      KEY idx_TracePoint_PointID (PointID),
      CONSTRAINT fk_TracePoint_Branch FOREIGN KEY (BranchID) REFERENCES Branches(BranchID) ON DELETE CASCADE,
      CONSTRAINT fk_TracePoint_Point FOREIGN KEY (PointID) REFERENCES Points(PointID)
    ) ENGINE=InnoDB
    """,
)


def ensure_schema() -> None:
    with db_cursor() as (_, cursor):
        for statement in SCHEMA_STATEMENTS:
            cursor.execute(statement)


@app.get("/api/healthz")
def health() -> tuple[Any, int]:
    try:
        with db_cursor() as (_, cursor):
            cursor.execute("SELECT 1 AS ok")
            cursor.fetchone()
        return jsonify({"status": "ok"})
    except Exception as exc:
        logger.exception("Database health check failed")
        return jsonify({"status": "database_unavailable", "error": str(exc)}), 503


@app.get("/api/dashboard")
def dashboard() -> Any:
    with db_cursor() as (_, cursor):
        cursor.execute("SELECT COUNT(*) AS branchTypeCount FROM BranchTypes")
        branch_type_count = one(cursor)["branchTypeCount"]
        cursor.execute("SELECT COUNT(*) AS branchCount FROM Branches")
        branch_count = one(cursor)["branchCount"]
        cursor.execute("SELECT COUNT(*) AS nodeCount FROM Nodes")
        node_count = one(cursor)["nodeCount"]
        cursor.execute("SELECT COUNT(*) AS pointCount FROM Points")
        point_count = one(cursor)["pointCount"]
        cursor.execute("SELECT COUNT(*) AS tracePointCount FROM TracePoint")
        trace_point_count = one(cursor)["tracePointCount"]
        cursor.execute(
            """
            SELECT n.NodeID AS nodeId, n.NodeName AS nodeName,
                   n.PointID AS pointId, p.PointCoordX AS pointCoordX,
                   p.PointCoordY AS pointCoordY
            FROM Nodes n JOIN Points p ON p.PointID = n.PointID
            WHERE NOT EXISTS (
              SELECT 1 FROM Branches b WHERE b.BranchEndNode = n.NodeID
            )
            ORDER BY n.NodeID
            LIMIT 12
            """
        )
        root_nodes = rows(cursor)
        cursor.execute(
            """
            SELECT bt.BranchTypeID AS branchTypeId,
                   bt.BranchTypeDescr AS branchTypeDescr,
                   COUNT(b.BranchID) AS branchCount
            FROM BranchTypes bt
            LEFT JOIN Branches b ON b.BranchTypeID = bt.BranchTypeID
            GROUP BY bt.BranchTypeID, bt.BranchTypeDescr
            ORDER BY branchCount DESC, bt.BranchTypeDescr
            """
        )
        breakdown = rows(cursor)
    return jsonify(
        {
            "branchTypeCount": branch_type_count,
            "branchCount": branch_count,
            "nodeCount": node_count,
            "pointCount": point_count,
            "tracePointCount": trace_point_count,
            "rootNodes": root_nodes,
            "branchTypeBreakdown": breakdown,
        }
    )


@app.get("/api/branch-types")
def list_branch_types() -> Any:
    with db_cursor() as (_, cursor):
        cursor.execute("SELECT BranchTypeID AS branchTypeId, BranchTypeDescr AS branchTypeDescr FROM BranchTypes ORDER BY BranchTypeDescr")
        return jsonify(rows(cursor))


@app.post("/api/branch-types")
def create_branch_type() -> tuple[Any, int]:
    try:
        name = required_text(body(), "branchTypeDescr")
        with db_cursor() as (_, cursor):
            cursor.execute("INSERT INTO BranchTypes (BranchTypeDescr) VALUES (%s)", (name,))
            new_id = cursor.lastrowid
            cursor.execute("SELECT BranchTypeID AS branchTypeId, BranchTypeDescr AS branchTypeDescr FROM BranchTypes WHERE BranchTypeID = %s", (new_id,))
            result = one(cursor)
        return jsonify(result), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.patch("/api/branch-types/<int:item_id>")
def update_branch_type(item_id: int) -> Any:
    try:
        name = required_text(body(), "branchTypeDescr")
        with db_cursor() as (_, cursor):
            cursor.execute("UPDATE BranchTypes SET BranchTypeDescr = %s WHERE BranchTypeID = %s", (name, item_id))
            if cursor.rowcount == 0:
                return jsonify({"error": "Branch type not found"}), 404
            cursor.execute("SELECT BranchTypeID AS branchTypeId, BranchTypeDescr AS branchTypeDescr FROM BranchTypes WHERE BranchTypeID = %s", (item_id,))
            return jsonify(one(cursor))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.delete("/api/branch-types/<int:item_id>")
def delete_branch_type(item_id: int) -> tuple[Any, int]:
    try:
        with db_cursor() as (_, cursor):
            cursor.execute("DELETE FROM BranchTypes WHERE BranchTypeID = %s", (item_id,))
            if cursor.rowcount == 0:
                return jsonify({"error": "Branch type not found"}), 404
        return "", 204
    except IntegrityError:
        return jsonify({"error": "Branch type is still used by branches"}), 409


def branch_select() -> str:
    return """
      SELECT b.BranchID AS branchId, b.BranchName AS branchName,
             b.BranchBeginNode AS branchBeginNode, b.BranchEndNode AS branchEndNode,
             b.BranchTypeID AS branchTypeId, bt.BranchTypeDescr AS branchTypeDescr
      FROM Branches b JOIN BranchTypes bt ON bt.BranchTypeID = b.BranchTypeID
    """


@app.get("/api/branches")
def list_branches() -> Any:
    search = request.args.get("search", "").strip()
    type_id = request.args.get("branchTypeId")
    query = branch_select() + " WHERE 1=1"
    params: list[Any] = []
    if search:
        query += " AND b.BranchName LIKE %s"
        params.append(f"%{search}%")
    if type_id:
        query += " AND b.BranchTypeID = %s"
        params.append(as_int(type_id, "branchTypeId"))
    query += " ORDER BY b.BranchID DESC"
    with db_cursor() as (_, cursor):
        cursor.execute(query, tuple(params))
        return jsonify(rows(cursor))


def branch_payload(payload: dict[str, Any]) -> tuple[str, int, int, int]:
    return (
        required_text(payload, "branchName"),
        as_int(payload.get("branchBeginNode"), "branchBeginNode"),
        as_int(payload.get("branchEndNode"), "branchEndNode"),
        as_int(payload.get("branchTypeId"), "branchTypeId"),
    )


@app.post("/api/branches")
def create_branch() -> tuple[Any, int]:
    try:
        values = branch_payload(body())
        with db_cursor() as (_, cursor):
            cursor.execute(
                "INSERT INTO Branches (BranchName, BranchBeginNode, BranchEndNode, BranchTypeID) VALUES (%s, %s, %s, %s)",
                values,
            )
            item_id = cursor.lastrowid
            cursor.execute(branch_select() + " WHERE b.BranchID = %s", (item_id,))
            result = one(cursor)
        return jsonify(result), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except IntegrityError as exc:
        return jsonify({"error": f"Invalid node or branch type reference: {exc}"}), 400


@app.get("/api/branches/<int:item_id>")
def get_branch(item_id: int) -> Any:
    with db_cursor() as (_, cursor):
        cursor.execute(branch_select() + " WHERE b.BranchID = %s", (item_id,))
        result = one(cursor)
    return jsonify(result) if result else (jsonify({"error": "Branch not found"}), 404)


@app.patch("/api/branches/<int:item_id>")
def update_branch(item_id: int) -> Any:
    try:
        values = branch_payload(body())
        with db_cursor() as (_, cursor):
            cursor.execute(
                "UPDATE Branches SET BranchName=%s, BranchBeginNode=%s, BranchEndNode=%s, BranchTypeID=%s WHERE BranchID=%s",
                (*values, item_id),
            )
            if cursor.rowcount == 0:
                return jsonify({"error": "Branch not found"}), 404
            cursor.execute(branch_select() + " WHERE b.BranchID = %s", (item_id,))
            return jsonify(one(cursor))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except IntegrityError:
        return jsonify({"error": "Invalid node or branch type reference"}), 400


@app.delete("/api/branches/<int:item_id>")
def delete_branch(item_id: int) -> tuple[Any, int]:
    with db_cursor() as (_, cursor):
        cursor.execute("DELETE FROM Branches WHERE BranchID = %s", (item_id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "Branch not found"}), 404
    return "", 204


@app.get("/api/nodes")
def list_nodes() -> Any:
    with db_cursor() as (_, cursor):
        cursor.execute(
            """
            SELECT n.NodeID AS nodeId, n.NodeName AS nodeName,
                   n.PointID AS pointId, p.PointCoordX AS pointCoordX,
                   p.PointCoordY AS pointCoordY
            FROM Nodes n JOIN Points p ON p.PointID = n.PointID
            ORDER BY n.NodeID
            """
        )
        return jsonify(rows(cursor))


@app.post("/api/nodes")
def create_node() -> tuple[Any, int]:
    try:
        payload = body()
        name = required_text(payload, "nodeName")
        point_id = as_int(payload.get("pointId"), "pointId")
        with db_cursor() as (_, cursor):
            cursor.execute("INSERT INTO Nodes (NodeName, PointID) VALUES (%s, %s)", (name, point_id))
            item_id = cursor.lastrowid
            cursor.execute(
                """
                SELECT n.NodeID AS nodeId, n.NodeName AS nodeName, n.PointID AS pointId,
                       p.PointCoordX AS pointCoordX, p.PointCoordY AS pointCoordY
                FROM Nodes n JOIN Points p ON p.PointID=n.PointID WHERE n.NodeID=%s
                """,
                (item_id,),
            )
            result = one(cursor)
        return jsonify(result), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except IntegrityError:
        return jsonify({"error": "Point does not exist or is already assigned to a node"}), 400


@app.patch("/api/nodes/<int:item_id>")
def update_node(item_id: int) -> Any:
    try:
        payload = body()
        name = required_text(payload, "nodeName")
        point_id = as_int(payload.get("pointId"), "pointId")
        with db_cursor() as (_, cursor):
            cursor.execute("UPDATE Nodes SET NodeName=%s, PointID=%s WHERE NodeID=%s", (name, point_id, item_id))
            if cursor.rowcount == 0:
                return jsonify({"error": "Node not found"}), 404
            cursor.execute(
                """
                SELECT n.NodeID AS nodeId, n.NodeName AS nodeName, n.PointID AS pointId,
                       p.PointCoordX AS pointCoordX, p.PointCoordY AS pointCoordY
                FROM Nodes n JOIN Points p ON p.PointID=n.PointID WHERE n.NodeID=%s
                """,
                (item_id,),
            )
            return jsonify(one(cursor))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except IntegrityError:
        return jsonify({"error": "Point does not exist or is already assigned to a node"}), 400


@app.delete("/api/nodes/<int:item_id>")
def delete_node(item_id: int) -> tuple[Any, int]:
    try:
        with db_cursor() as (_, cursor):
            cursor.execute("DELETE FROM Nodes WHERE NodeID=%s", (item_id,))
            if cursor.rowcount == 0:
                return jsonify({"error": "Node not found"}), 404
        return "", 204
    except IntegrityError:
        return jsonify({"error": "Node is referenced by a branch"}), 409


@app.get("/api/points")
def list_points() -> Any:
    with db_cursor() as (_, cursor):
        cursor.execute("SELECT PointID AS pointId, PointCoordX AS pointCoordX, PointCoordY AS pointCoordY FROM Points ORDER BY PointID")
        return jsonify(rows(cursor))


@app.post("/api/points")
def create_point() -> tuple[Any, int]:
    try:
        payload = body()
        x = as_float(payload.get("pointCoordX"), "pointCoordX")
        y = as_float(payload.get("pointCoordY"), "pointCoordY")
        with db_cursor() as (_, cursor):
            cursor.execute("INSERT INTO Points (PointCoordX, PointCoordY) VALUES (%s, %s)", (x, y))
            item_id = cursor.lastrowid
            cursor.execute("SELECT PointID AS pointId, PointCoordX AS pointCoordX, PointCoordY AS pointCoordY FROM Points WHERE PointID=%s", (item_id,))
            result = one(cursor)
        return jsonify(result), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.patch("/api/points/<int:item_id>")
def update_point(item_id: int) -> Any:
    try:
        payload = body()
        x = as_float(payload.get("pointCoordX"), "pointCoordX")
        y = as_float(payload.get("pointCoordY"), "pointCoordY")
        with db_cursor() as (_, cursor):
            cursor.execute("UPDATE Points SET PointCoordX=%s, PointCoordY=%s WHERE PointID=%s", (x, y, item_id))
            if cursor.rowcount == 0:
                return jsonify({"error": "Point not found"}), 404
            cursor.execute("SELECT PointID AS pointId, PointCoordX AS pointCoordX, PointCoordY AS pointCoordY FROM Points WHERE PointID=%s", (item_id,))
            return jsonify(one(cursor))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.delete("/api/points/<int:item_id>")
def delete_point(item_id: int) -> tuple[Any, int]:
    try:
        with db_cursor() as (_, cursor):
            cursor.execute("DELETE FROM Points WHERE PointID=%s", (item_id,))
            if cursor.rowcount == 0:
                return jsonify({"error": "Point not found"}), 404
        return "", 204
    except IntegrityError:
        return jsonify({"error": "Point is referenced by a node or trace"}), 409


@app.get("/api/branches/<int:branch_id>/trace")
def list_trace_points(branch_id: int) -> Any:
    with db_cursor() as (_, cursor):
        cursor.execute(
            """
            SELECT t.PointOrder AS pointOrder, t.BranchID AS branchId,
                   t.PointID AS pointId, p.PointCoordX AS pointCoordX,
                   p.PointCoordY AS pointCoordY
            FROM TracePoint t JOIN Points p ON p.PointID=t.PointID
            WHERE t.BranchID=%s ORDER BY t.PointOrder
            """,
            (branch_id,),
        )
        return jsonify(rows(cursor))


@app.post("/api/branches/<int:branch_id>/trace")
def create_trace_point(branch_id: int) -> tuple[Any, int]:
    try:
        payload = body()
        point_order = as_int(payload.get("pointOrder"), "pointOrder")
        point_id = as_int(payload.get("pointId"), "pointId")
        with db_cursor() as (_, cursor):
            cursor.execute("INSERT INTO TracePoint (PointOrder, BranchID, PointID) VALUES (%s,%s,%s)", (point_order, branch_id, point_id))
            cursor.execute(
                """
                SELECT t.PointOrder AS pointOrder, t.BranchID AS branchId,
                       t.PointID AS pointId, p.PointCoordX AS pointCoordX,
                       p.PointCoordY AS pointCoordY
                FROM TracePoint t JOIN Points p ON p.PointID=t.PointID
                WHERE t.BranchID=%s AND t.PointOrder=%s
                """,
                (branch_id, point_order),
            )
            result = one(cursor)
        return jsonify(result), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except IntegrityError:
        return jsonify({"error": "Branch or point does not exist, or this order already exists"}), 400


@app.delete("/api/trace/<int:branch_id>/<int:point_order>")
def delete_trace_point(branch_id: int, point_order: int) -> tuple[Any, int]:
    with db_cursor() as (_, cursor):
        cursor.execute("DELETE FROM TracePoint WHERE BranchID=%s AND PointOrder=%s", (branch_id, point_order))
        if cursor.rowcount == 0:
            return jsonify({"error": "Trace point not found"}), 404
    return "", 204


@app.errorhandler(ValueError)
def handle_value_error(error: ValueError) -> tuple[Any, int]:
    return jsonify({"error": str(error)}), 400


@app.errorhandler(Error)
def handle_database_error(error: Error) -> tuple[Any, int]:
    logger.exception("Database request failed")
    return jsonify({"error": "Database request failed", "detail": str(error)}), 503


if __name__ == "__main__":
    try:
        ensure_schema()
        logger.info("MySQL schema is ready")
    except Exception:
        logger.exception("Could not initialize MySQL schema; API will start and report 503 until it is reachable")

    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")))