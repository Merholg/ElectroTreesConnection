import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Boxes,
  Cable,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  GitBranch,
  Grid2X2,
  Layers3,
  MapPin,
  Menu,
  Network,
  Plus,
  RadioTower,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal,
  Trash2,
  Waypoints,
  X,
} from 'lucide-react';
import {
  type Branch,
  type BranchInput,
  type BranchTypeInput,
  type NodeInput,
  type PointInput,
  type TracePoint,
  type TracePointInput,
  getDeleteBranchMutationOptions,
  getDeleteNodeMutationOptions,
  getDeletePointMutationOptions,
  getListBranchesQueryKey,
  getListBranchTypesQueryKey,
  getListNodesQueryKey,
  getListPointsQueryKey,
  getListTracePointsQueryKey,
  useCreateBranch,
  useCreateBranchType,
  useCreateNode,
  useCreatePoint,
  useCreateTracePoint,
  useDeleteBranch,
  useDeleteNode,
  useDeletePoint,
  useDeleteTracePoint,
  useGetDashboard,
  useListBranches,
  useListBranchTypes,
  useListNodes,
  useListPoints,
  useListTracePoints,
} from '@workspace/api-client-react';
import { Badge } from '@workspace/electrotrees-ds/components/ui/badge';
import { Button } from '@workspace/electrotrees-ds/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/electrotrees-ds/components/ui/card';
import { Input } from '@workspace/electrotrees-ds/components/ui/input';
import { Label } from '@workspace/electrotrees-ds/components/ui/label';
import { Separator } from '@workspace/electrotrees-ds/components/ui/separator';
import { Textarea } from '@workspace/electrotrees-ds/components/ui/textarea';
import { Toaster } from '@workspace/electrotrees-ds/components/ui/toaster';
import { TooltipProvider } from '@workspace/electrotrees-ds/components/ui/tooltip';
import { toast } from '@workspace/electrotrees-ds/hooks/use-toast';
import { cn } from '@workspace/electrotrees-ds/lib/utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const navItems = [
  { href: '/', label: 'Обзор', icon: Activity },
  { href: '/branches', label: 'Ветви и провода', icon: GitBranch },
  { href: '/nodes', label: 'Узлы', icon: Network },
  { href: '/points', label: 'Точки трассировки', icon: MapPin },
  { href: '/branch-types', label: 'Типы ветвей', icon: Layers3 },
];

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    return () => {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'normal';
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppShell />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppShell() {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          data-testid="sidebar-navigation"
        >
          <div className="flex h-full flex-col">
            <div className="flex h-20 items-center gap-3 px-5">
              <div className="grid size-9 place-items-center rounded-md border border-primary/60 bg-primary/10 text-primary">
                <Waypoints className="size-5" />
              </div>
              <div>
                <p className="font-mono text-xs font-bold tracking-[0.16em] text-primary">
                  ETC / 01
                </p>
                <p className="text-sm font-semibold text-sidebar-foreground">
                  ElectroTrees
                </p>
              </div>
              <button
                className="ml-auto text-sidebar-foreground/70 lg:hidden"
                onClick={() => setSidebarOpen(false)}
                data-testid="button-close-sidebar"
                aria-label="Закрыть меню"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="px-4 pb-4">
              <div className="rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  рабочая область
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-sidebar-foreground">
                  <span className="size-1.5 rounded-full bg-chart-3 status-pulse" />
                  Схема щита / Main
                </div>
              </div>
            </div>
            <nav className="flex-1 space-y-1 px-3" aria-label="Основная навигация">
              <p className="px-3 pb-2 pt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                навигация
              </p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === '/'
                    ? location === '/'
                    : location.startsWith(item.href);
                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                      active
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )}
                    onClick={() => setSidebarOpen(false)}
                    data-testid={`link-nav-${item.label}`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                    <ChevronRight
                      className={cn(
                        'ml-auto size-3 opacity-0 transition-opacity group-hover:opacity-70',
                        active && 'opacity-70',
                      )}
                    />
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-sidebar-border p-4">
              <div className="flex items-center gap-3 rounded-md px-2 py-2 text-sidebar-foreground/70">
                <Settings2 className="size-4" />
                <span className="text-xs">SQLite / Flask API</span>
                <span className="ml-auto size-2 rounded-full bg-chart-3" />
              </div>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <button
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Закрыть навигацию"
            data-testid="button-sidebar-overlay"
          />
        )}

        <div className="min-w-0 flex-1">
          <header className="flex h-20 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <button
                className="text-muted-foreground lg:hidden"
                onClick={() => setSidebarOpen(true)}
                data-testid="button-open-sidebar"
                aria-label="Открыть меню"
              >
                <Menu className="size-5" />
              </button>
              <div className="font-mono text-xs text-muted-foreground">
                <span className="text-primary">SYS</span>
                <span className="mx-2 text-border">/</span>
                <span data-testid="text-current-route">
                  {location === '/' ? 'overview' : location.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <span className="size-1.5 rounded-full bg-chart-3 status-pulse" />
                API online
              </div>
              <div className="grid size-8 place-items-center rounded-full border border-border bg-card font-mono text-xs text-primary">
                M
              </div>
            </div>
          </header>
          <main className="panel-grid min-h-[calc(100vh-5rem)] px-5 py-7 md:px-8">
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/branches" component={BranchesPage} />
              <Route path="/nodes" component={NodesPage} />
              <Route path="/points" component={PointsPage} />
              <Route path="/branch-types" component={BranchTypesPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.26em] text-primary">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent = 'primary',
}: {
  label: string;
  value: number | string;
  icon: typeof Activity;
  accent?: 'primary' | 'chart-2' | 'chart-3' | 'destructive';
}) {
  return (
    <Card className="relative overflow-hidden border-border/80 bg-card/80">
      <div className={cn('absolute inset-x-0 top-0 h-px', `bg-${accent}`)} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <Icon className={cn('size-4', accent === 'destructive' ? 'text-destructive' : `text-${accent}`)} />
        </div>
        <p className="mt-4 font-mono text-3xl font-semibold tracking-tight" data-testid={`metric-${label}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const dashboard = useGetDashboard();
  const data = dashboard.data;
  const branches = useListBranches();
  const points = useListPoints();

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeading
        eyebrow="electrical tree / overview"
        title="Контур соединений"
        description="Карта связей электрического щита: ветви, узлы и координаты трассировки в одной рабочей области."
        action={
          <Button asChild data-testid="button-open-branches">
            <Link href="/branches">
              <Cable className="size-4" />
              Открыть ветви
            </Link>
          </Button>
        }
      />
      {dashboard.isLoading ? (
        <LoadingState label="Синхронизация с SQLite…" />
      ) : dashboard.isError ? (
        <ErrorState />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="ветви" value={data.branchCount} icon={GitBranch} />
            <MetricCard label="узлы" value={data.nodeCount} icon={Network} accent="chart-2" />
            <MetricCard label="точки" value={data.pointCount} icon={MapPin} accent="chart-3" />
            <MetricCard label="трассировка" value={data.tracePointCount} icon={Waypoints} accent="chart-2" />
            <MetricCard label="типы ветвей" value={data.branchTypeCount} icon={Boxes} accent="primary" />
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
            <Card className="border-border/80 bg-card/80">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Корневые узлы</CardTitle>
                  <CardDescription className="mt-1">
                    Точки начала дерева соединений
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  LIVE
                </Badge>
              </CardHeader>
              <CardContent>
                {data.rootNodes.length === 0 ? (
                  <EmptyState title="Корневые узлы не найдены" description="Добавьте узлы и ветви, чтобы увидеть структуру дерева." />
                ) : (
                  <div className="space-y-2">
                    {data.rootNodes.map((node) => (
                      <div
                        key={node.nodeId}
                        className="flex items-center gap-3 rounded-md border border-border/70 bg-background/40 px-3 py-3"
                        data-testid={`row-root-node-${node.nodeId}`}
                      >
                        <span className="grid size-8 place-items-center rounded border border-primary/30 bg-primary/10 text-primary">
                          <RadioTower className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{node.nodeName}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            NODE-{String(node.nodeId).padStart(4, '0')} · P{node.pointId}
                          </p>
                        </div>
                        <div className="ml-auto text-right font-mono text-[10px] text-muted-foreground">
                          <p>X {node.pointCoordX}</p>
                          <p>Y {node.pointCoordY}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-border/80 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Распределение ветвей</CardTitle>
                <CardDescription className="mt-1">
                  Состав схемы по типам соединений
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.branchTypeBreakdown.length === 0 ? (
                  <EmptyState title="Типы пока не добавлены" description="Создайте первый тип ветви." />
                ) : (
                  data.branchTypeBreakdown.map((item, index) => (
                    <div key={item.branchTypeId} data-testid={`row-type-breakdown-${item.branchTypeId}`}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span>{item.branchTypeDescr}</span>
                        <span className="font-mono text-primary">{item.branchCount}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn('h-full rounded-full', ['bg-primary', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4'][index % 4])}
                          style={{ width: `${Math.max(8, (item.branchCount / Math.max(1, data.branchCount)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Card className="border-border/80 bg-card/80">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Состояние источников</CardTitle>
                  <CardDescription className="mt-1">Последний ответ сервисов данных</CardDescription>
                </div>
                <CircleCheck className="size-5 text-chart-3" />
              </CardHeader>
              <CardContent className="space-y-3">
                <StatusRow label="Flask API" value="connected" />
                <StatusRow label="SQLite schema" value="ready" />
                <StatusRow label="Branch graph" value={`${branches.data?.length ?? 0} records`} />
                <StatusRow label="Coordinate layer" value={`${points.data?.length ?? 0} points`} />
              </CardContent>
            </Card>
            <Card className="border-border/80 bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Операторская заметка</CardTitle>
                <CardDescription className="mt-1">Контекст текущей схемы</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="border-l-2 border-primary/60 pl-4 text-sm leading-6 text-muted-foreground">
                  Модель соединений хранит геометрию отдельно от узлов. Поэтому координаты
                  можно обновлять независимо, а TracePoint задаёт порядок прохождения ветви.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function BranchesPage() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [expandedBranchId, setExpandedBranchId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const branches = useListBranches({
    search: search || undefined,
    branchTypeId: selectedType ? Number(selectedType) : undefined,
  });
  const types = useListBranchTypes();
  const nodes = useListNodes();
  const points = useListPoints();
  const create = useCreateBranch();
  const remove = useDeleteBranch();

  const handleCreate = (payload: BranchInput) => {
    create.mutate(
      { data: payload },
      {
        onSuccess: (branch) => {
          toast({ title: 'Ветвь добавлена', description: 'Связь записана в SQLite.' });
          setShowCreate(false);
          setExpandedBranchId(branch.branchId);
          queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        },
        onError: () => toast({ title: 'Не удалось добавить ветвь', variant: 'destructive' }),
      },
    );
  };

  const handleDelete = (branch: Branch) => {
    if (!window.confirm(`Удалить ветвь «${branch.branchName}»?`)) return;
    remove.mutate(
      { id: branch.branchId },
      {
        onSuccess: () => {
          toast({ title: 'Ветвь удалена' });
          if (expandedBranchId === branch.branchId) setExpandedBranchId(null);
          queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        },
        onError: () => toast({ title: 'Не удалось удалить ветвь', variant: 'destructive' }),
      },
    );
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeading
        eyebrow="connection registry / branches"
        title="Ветви и провода"
        description="Связи между узлами щита с упорядоченными промежуточными точками трассировки."
        action={
          <Button onClick={() => setShowCreate((value) => !value)} data-testid="button-add-branch">
            <Plus className="size-4" />
            Добавить ветвь
          </Button>
        }
      />
      {showCreate && (
        <CreateBranchCard
          types={types.data ?? []}
          nodes={nodes.data ?? []}
          pending={create.isPending}
          onCancel={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
      <Card className="border-border/80 bg-card/80">
        <CardHeader className="gap-4 border-b border-border/70 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Реестр ветвей</CardTitle>
            <CardDescription className="mt-1">
              {branches.data?.length ?? 0} записей в текущей выборке
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по имени…"
                className="w-full pl-9 sm:w-56"
                data-testid="input-search-branches"
              />
            </div>
            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              data-testid="select-branch-type-filter"
              aria-label="Фильтр по типу ветви"
            >
              <option value="">Все типы</option>
              {(types.data ?? []).map((type) => (
                <option key={type.branchTypeId} value={type.branchTypeId}>
                  {type.branchTypeDescr}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {branches.isLoading ? (
            <LoadingState label="Загрузка ветвей…" />
          ) : branches.isError ? (
            <ErrorState />
          ) : (branches.data ?? []).length === 0 ? (
            <EmptyState title="Ветви не найдены" description="Измените фильтр или добавьте первую связь." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-border/70 bg-muted/30 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">ветвь</th>
                    <th className="px-5 py-3 font-medium">тип</th>
                    <th className="px-5 py-3 font-medium">направление</th>
                    <th className="px-5 py-3 font-medium">трассировка</th>
                    <th className="px-5 py-3 font-medium">id</th>
                    <th className="px-5 py-3 text-right font-medium">действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(branches.data ?? []).map((branch) => (
                    <Fragment key={branch.branchId}>
                      <tr
                        className="group transition-colors hover:bg-muted/25"
                        data-testid={`row-branch-${branch.branchId}`}
                      >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded border border-primary/30 bg-primary/10 text-primary">
                            <Cable className="size-4" />
                          </span>
                          <span className="font-medium">{branch.branchName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="outline">{branch.branchTypeDescr}</Badge>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                        <span className="text-chart-2">N{branch.branchBeginNode}</span>
                        <span className="mx-2 text-primary">→</span>
                        <span className="text-chart-3">N{branch.branchEndNode}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedBranchId((current) => current === branch.branchId ? null : branch.branchId)}
                          aria-expanded={expandedBranchId === branch.branchId}
                          aria-controls={`trace-editor-${branch.branchId}`}
                          data-testid={`button-toggle-trace-${branch.branchId}`}
                        >
                          <Waypoints className="size-4" />
                          {expandedBranchId === branch.branchId ? 'Скрыть точки' : 'Точки трассы'}
                        </Button>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                        BR-{String(branch.branchId).padStart(4, '0')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(branch)}
                          disabled={remove.isPending}
                          data-testid={`button-delete-branch-${branch.branchId}`}
                          aria-label={`Удалить ${branch.branchName}`}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </td>
                      </tr>
                      {expandedBranchId === branch.branchId && (
                        <tr className="bg-muted/10" data-testid={`row-trace-editor-${branch.branchId}`}>
                          <td colSpan={6} className="px-5 py-4">
                            <BranchTracePointManager
                              branchId={branch.branchId}
                              branchName={branch.branchName}
                              branchBeginNode={branch.branchBeginNode}
                              branchEndNode={branch.branchEndNode}
                              points={points.data ?? []}
                              pointsLoading={points.isLoading}
                              pointsError={points.isError}
                              endpointPointIds={(nodes.data ?? [])
                                .filter((node) => node.nodeId === branch.branchBeginNode || node.nodeId === branch.branchEndNode)
                                .map((node) => node.pointId)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateBranchCard({
  types,
  nodes,
  pending,
  onCancel,
  onSubmit,
}: {
  types: { branchTypeId: number; branchTypeDescr: string }[];
  nodes: { nodeId: number; nodeName: string }[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: BranchInput) => void;
}) {
  const form = useForm<BranchInput>({
    defaultValues: { branchName: '', branchBeginNode: nodes[0]?.nodeId ?? 0, branchEndNode: nodes[1]?.nodeId ?? nodes[0]?.nodeId ?? 0, branchTypeId: types[0]?.branchTypeId ?? 0 },
  });
  return (
    <Card className="mb-5 border-primary/40 bg-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Новая ветвь</CardTitle>
            <CardDescription className="mt-1">Свяжите два узла; промежуточные точки трассировки добавляются после создания.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} data-testid="button-cancel-branch">
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="branchName">Название</Label>
            <Input id="branchName" placeholder="QF-01 → освещение" {...form.register('branchName', { required: true })} data-testid="input-branch-name" />
          </div>
          <SelectField label="Начальный узел" value={form.watch('branchBeginNode')} onChange={(value) => form.setValue('branchBeginNode', Number(value))} options={nodes.map((node) => ({ value: node.nodeId, label: `N${node.nodeId} · ${node.nodeName}` }))} testId="select-branch-begin" />
          <SelectField label="Конечный узел" value={form.watch('branchEndNode')} onChange={(value) => form.setValue('branchEndNode', Number(value))} options={nodes.map((node) => ({ value: node.nodeId, label: `N${node.nodeId} · ${node.nodeName}` }))} testId="select-branch-end" />
          <SelectField label="Тип ветви" value={form.watch('branchTypeId')} onChange={(value) => form.setValue('branchTypeId', Number(value))} options={types.map((type) => ({ value: type.branchTypeId, label: type.branchTypeDescr }))} testId="select-branch-type" />
          <div className="flex gap-2 md:col-span-4">
            <Button type="submit" disabled={pending || !types.length || nodes.length < 2} data-testid="button-submit-branch">
              {pending ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Сохранить ветвь
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-branch-form">
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function BranchTracePointManager({
  branchId,
  branchName,
  branchBeginNode,
  branchEndNode,
  points,
  pointsLoading,
  pointsError,
  endpointPointIds,
}: {
  branchId: number;
  branchName: string;
  branchBeginNode: number;
  branchEndNode: number;
  points: { pointId: number; pointCoordX: number; pointCoordY: number }[];
  pointsLoading: boolean;
  pointsError: boolean;
  endpointPointIds: number[];
}) {
  const queryClient = useQueryClient();
  const tracePoints = useListTracePoints(branchId);
  const addTracePoint = useCreateTracePoint();
  const removeTracePoint = useDeleteTracePoint();
  const [selectedPointId, setSelectedPointId] = useState(0);
  const currentTracePoints = tracePoints.data ?? [];
  const usedPointIds = new Set(currentTracePoints.map((point) => point.pointId));
  const endpointIds = new Set(endpointPointIds);
  const availablePoints = points.filter((point) => !usedPointIds.has(point.pointId) && !endpointIds.has(point.pointId));
  const effectivePointId = availablePoints.some((point) => point.pointId === selectedPointId)
    ? selectedPointId
    : availablePoints[0]?.pointId ?? 0;

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!effectivePointId) return;
    const pointOrder = Math.max(0, ...currentTracePoints.map((point) => point.pointOrder)) + 1;
    const data: TracePointInput = { pointOrder, pointId: effectivePointId };
    addTracePoint.mutate(
      { branchId, data },
      {
        onSuccess: () => {
          setSelectedPointId(0);
          queryClient.invalidateQueries({ queryKey: getListTracePointsQueryKey(branchId) });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
          toast({ title: 'Точка добавлена в трассировку', description: `Порядок ${pointOrder}.` });
        },
        onError: () => toast({ title: 'Не удалось добавить точку трассировки', variant: 'destructive' }),
      },
    );
  };

  const handleRemove = (point: TracePoint) => {
    removeTracePoint.mutate(
      { branchId, pointOrder: point.pointOrder },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTracePointsQueryKey(branchId) });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
          toast({ title: 'Точка убрана из трассировки' });
        },
        onError: () => toast({ title: 'Не удалось убрать точку из трассировки', variant: 'destructive' }),
      },
    );
  };

  return (
    <section
      id={`trace-editor-${branchId}`}
      className="rounded-md border border-border/70 bg-background/40 p-4"
      data-testid={`trace-manager-${branchId}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Waypoints className="size-4 text-primary" />
            <h3 className="text-sm font-medium">Точки трассировки · {branchName}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Порядок от узла N{branchBeginNode} к узлу N{branchEndNode}. Новые точки добавляются в конец.
          </p>
        </div>
        <Badge variant="outline">{currentTracePoints.length} промежуточных</Badge>
      </div>

      {tracePoints.isLoading || pointsLoading ? (
        <LoadingState label="Загрузка точек трассировки…" />
      ) : tracePoints.isError || pointsError ? (
        <ErrorState />
      ) : (
        <>
          {currentTracePoints.length === 0 ? (
            <p className="mt-4 rounded-md border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
              Промежуточные точки не добавлены.
            </p>
          ) : (
            <ol className="mt-4 space-y-2">
              {currentTracePoints.map((point, index) => (
                <li
                  key={`${point.branchId}-${point.pointOrder}`}
                  className="flex items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2"
                  data-testid={`row-trace-point-${branchId}-${point.pointOrder}`}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded border border-primary/30 bg-primary/10 font-mono text-xs text-primary">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <MapPin className="size-4 shrink-0 text-chart-3" />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm text-foreground">P{point.pointId}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      X {point.pointCoordX} · Y {point.pointCoordY}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(point)}
                    disabled={removeTracePoint.isPending}
                    aria-label={`Убрать точку P${point.pointId} из ветви ${branchName}`}
                    data-testid={`button-remove-trace-point-${branchId}-${point.pointOrder}`}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ol>
          )}

          {availablePoints.length > 0 ? (
            <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleAdd}>
              <div className="min-w-0 flex-1">
                <SelectField
                  label="Следующая промежуточная точка"
                  value={effectivePointId}
                  onChange={(value) => setSelectedPointId(Number(value))}
                  options={availablePoints.map((point) => ({
                    value: point.pointId,
                    label: `P${point.pointId} · (${point.pointCoordX}, ${point.pointCoordY})`,
                  }))}
                  testId={`select-trace-point-${branchId}`}
                />
              </div>
              <Button
                type="submit"
                disabled={addTracePoint.isPending || removeTracePoint.isPending || !effectivePointId}
                data-testid={`button-add-trace-point-${branchId}`}
              >
                {addTracePoint.isPending ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Добавить в трассу
              </Button>
            </form>
          ) : points.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Сначала создайте координатные точки на странице «Точки трассировки».
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Нет свободных промежуточных точек: конечные точки и уже добавленные точки нельзя выбрать повторно.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function NodesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const nodes = useListNodes();
  const points = useListPoints();
  const create = useCreateNode();
  const remove = useDeleteNode();

  const submit = (payload: NodeInput) => {
    create.mutate({ data: payload }, {
      onSuccess: () => {
        toast({ title: 'Узел добавлен' });
        setShowCreate(false);
        queryClient.invalidateQueries({ queryKey: getListNodesQueryKey() });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      },
      onError: () => toast({ title: 'Не удалось добавить узел', variant: 'destructive' }),
    });
  };

  const removeNode = (id: number) => {
    if (!window.confirm('Удалить узел?')) return;
    remove.mutate({ id }, {
      onSuccess: () => {
        toast({ title: 'Узел удалён' });
        queryClient.invalidateQueries({ queryKey: getListNodesQueryKey() });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      },
      onError: () => toast({ title: 'Узел используется в ветви', variant: 'destructive' }),
    });
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeading
        eyebrow="connection registry / nodes"
        title="Узлы схемы"
        description="Логические точки соединений, привязанные к координатам на плане электрического щита."
        action={<Button onClick={() => setShowCreate((value) => !value)} data-testid="button-add-node"><Plus className="size-4" />Добавить узел</Button>}
      />
      {showCreate && <CreateNodeCard points={points.data ?? []} pending={create.isPending} onCancel={() => setShowCreate(false)} onSubmit={submit} />}
      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Список узлов</CardTitle>
          <CardDescription className="mt-1">{nodes.data?.length ?? 0} элементов</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {nodes.isLoading ? <LoadingState label="Загрузка узлов…" /> : nodes.isError ? <ErrorState /> : (
            <div className="grid gap-px bg-border/50 md:grid-cols-2">
              {(nodes.data ?? []).map((node) => (
                <div key={node.nodeId} className="flex items-center gap-4 bg-card p-5" data-testid={`card-node-${node.nodeId}`}>
                  <div className="grid size-10 place-items-center rounded-md border border-chart-2/30 bg-chart-2/10 text-chart-2"><Network className="size-5" /></div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{node.nodeName}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">NODE-{String(node.nodeId).padStart(4, '0')} · POINT-{node.pointId}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">({node.pointCoordX}, {node.pointCoordY})</p>
                  </div>
                  <Button className="ml-auto" variant="ghost" size="icon" onClick={() => removeNode(node.nodeId)} data-testid={`button-delete-node-${node.nodeId}`} aria-label={`Удалить узел ${node.nodeName}`}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              ))}
              {(nodes.data ?? []).length === 0 && <div className="md:col-span-2"><EmptyState title="Узлы не добавлены" description="Создайте узел, чтобы начать собирать дерево." /></div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateNodeCard({ points, pending, onCancel, onSubmit }: { points: { pointId: number; pointCoordX: number; pointCoordY: number }[]; pending: boolean; onCancel: () => void; onSubmit: (payload: NodeInput) => void }) {
  const form = useForm<{ nodeLabel: string; pointId: number }>({ defaultValues: { nodeLabel: '', pointId: points[0]?.pointId ?? 0 } });
  return (
    <Card className="mb-5 border-primary/40 bg-primary/5">
      <CardHeader><div className="flex items-start justify-between"><div><CardTitle className="text-base">Новый узел</CardTitle><CardDescription className="mt-1">Каждая точка может принадлежать одному узлу.</CardDescription></div><Button variant="ghost" size="icon" onClick={onCancel} data-testid="button-cancel-node"><X className="size-4" /></Button></div></CardHeader>
      <CardContent><form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={form.handleSubmit(({ nodeLabel, pointId }) => onSubmit({ nodeName: nodeLabel, pointId }))}><div className="space-y-2"><Label htmlFor="nodeLabel">Название узла</Label><Input id="nodeLabel" placeholder="Вводной автомат" {...form.register('nodeLabel', { required: true })} data-testid="input-node-name" /></div><SelectField label="Координатная точка" value={form.watch('pointId')} onChange={(value) => form.setValue('pointId', Number(value))} options={points.map((point) => ({ value: point.pointId, label: `P${point.pointId} · (${point.pointCoordX}, ${point.pointCoordY})` }))} testId="select-node-point" /><div className="flex items-end gap-2"><Button type="submit" disabled={pending || !points.length} data-testid="button-submit-node">{pending ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}Сохранить</Button><Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-node-form">Отмена</Button></div></form></CardContent>
    </Card>
  );
}

function PointsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const points = useListPoints();
  const create = useCreatePoint();
  const remove = useDeletePoint();
  const submit = (payload: PointInput) => {
    create.mutate({ data: payload }, {
      onSuccess: () => { toast({ title: 'Точка добавлена' }); setShowCreate(false); queryClient.invalidateQueries({ queryKey: getListPointsQueryKey() }); queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] }); },
      onError: () => toast({ title: 'Не удалось добавить точку', variant: 'destructive' }),
    });
  };
  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeading eyebrow="geometry layer / points" title="Точки трассировки" description="Координатный слой схемы. Используется узлами и промежуточными точками ветвей." action={<Button onClick={() => setShowCreate((value) => !value)} data-testid="button-add-point"><Plus className="size-4" />Добавить точку</Button>} />
      {showCreate && <CreatePointCard pending={create.isPending} onCancel={() => setShowCreate(false)} onSubmit={submit} />}
      <Card className="border-border/80 bg-card/80">
        <CardHeader><CardTitle className="text-base">Координатная сетка</CardTitle><CardDescription className="mt-1">{points.data?.length ?? 0} точек в слое</CardDescription></CardHeader>
        <CardContent className="p-0">
          {points.isLoading ? <LoadingState label="Загрузка координат…" /> : points.isError ? <ErrorState /> : (points.data ?? []).length === 0 ? <EmptyState title="Точки не добавлены" description="Добавьте координату для привязки первого узла." /> : (
            <div className="grid gap-px bg-border/50 sm:grid-cols-2 lg:grid-cols-3">
              {(points.data ?? []).map((point) => <div key={point.pointId} className="flex items-center gap-4 bg-card p-5" data-testid={`card-point-${point.pointId}`}><div className="grid size-10 place-items-center rounded-md border border-chart-3/30 bg-chart-3/10 text-chart-3"><MapPin className="size-5" /></div><div><p className="font-mono text-sm text-primary">P{String(point.pointId).padStart(4, '0')}</p><p className="mt-1 font-mono text-xs text-muted-foreground">X {point.pointCoordX} · Y {point.pointCoordY}</p></div><Button className="ml-auto" variant="ghost" size="icon" onClick={() => { if (!window.confirm('Удалить точку?')) return; remove.mutate({ id: point.pointId }, { onSuccess: () => { toast({ title: 'Точка удалена' }); queryClient.invalidateQueries({ queryKey: getListPointsQueryKey() }); }, onError: () => toast({ title: 'Точка используется в схеме', variant: 'destructive' }) }); }} data-testid={`button-delete-point-${point.pointId}`} aria-label="Удалить точку"><Trash2 className="size-4 text-destructive" /></Button></div>)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreatePointCard({ pending, onCancel, onSubmit }: { pending: boolean; onCancel: () => void; onSubmit: (payload: PointInput) => void }) {
  const form = useForm<PointInput>({ defaultValues: { pointCoordX: 0, pointCoordY: 0 } });
  return <Card className="mb-5 border-primary/40 bg-primary/5"><CardHeader><div className="flex items-start justify-between"><div><CardTitle className="text-base">Новая точка</CardTitle><CardDescription className="mt-1">Координаты в системе плана щита.</CardDescription></div><Button variant="ghost" size="icon" onClick={onCancel} data-testid="button-cancel-point"><X className="size-4" /></Button></div></CardHeader><CardContent><form className="grid gap-4 sm:grid-cols-3" onSubmit={form.handleSubmit(onSubmit)}><div className="space-y-2"><Label htmlFor="pointX">Координата X</Label><Input id="pointX" type="number" step="0.001" {...form.register('pointCoordX', { valueAsNumber: true })} data-testid="input-point-x" /></div><div className="space-y-2"><Label htmlFor="pointY">Координата Y</Label><Input id="pointY" type="number" step="0.001" {...form.register('pointCoordY', { valueAsNumber: true })} data-testid="input-point-y" /></div><div className="flex items-end gap-2"><Button type="submit" disabled={pending} data-testid="button-submit-point">{pending ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}Сохранить</Button><Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-point-form">Отмена</Button></div></form></CardContent></Card>;
}

function BranchTypesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const queryClient = useQueryClient();
  const types = useListBranchTypes();
  const create = useCreateBranchType();
  const remove = useDeleteNode();
  const submit = () => {
    if (!newName.trim()) return;
    create.mutate({ data: { branchTypeDescr: newName.trim() } as BranchTypeInput }, {
      onSuccess: () => { toast({ title: 'Тип ветви добавлен' }); setNewName(''); setShowCreate(false); queryClient.invalidateQueries({ queryKey: getListBranchTypesQueryKey() }); },
      onError: () => toast({ title: 'Не удалось добавить тип', variant: 'destructive' }),
    });
  };
  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeading eyebrow="connection taxonomy / branch types" title="Типы ветвей" description="Справочник, который описывает назначение и природу проводников в схеме." action={<Button onClick={() => setShowCreate((value) => !value)} data-testid="button-add-branch-type"><Plus className="size-4" />Добавить тип</Button>} />
      {showCreate && <Card className="mb-5 border-primary/40 bg-primary/5"><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end"><div className="flex-1 space-y-2"><Label htmlFor="branchTypeDescr">Название типа</Label><Input id="branchTypeDescr" value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Силовая линия" data-testid="input-branch-type-name" /></div><Button onClick={submit} disabled={create.isPending} data-testid="button-submit-branch-type"><Plus className="size-4" />Сохранить</Button><Button variant="outline" onClick={() => setShowCreate(false)} data-testid="button-cancel-branch-type">Отмена</Button></CardContent></Card>}
      <Card className="border-border/80 bg-card/80"><CardHeader><CardTitle className="text-base">Справочник ветвей</CardTitle><CardDescription className="mt-1">Управление категориями соединений</CardDescription></CardHeader><CardContent className="space-y-2">{types.isLoading ? <LoadingState label="Загрузка типов…" /> : types.isError ? <ErrorState /> : (types.data ?? []).length === 0 ? <EmptyState title="Типы не добавлены" description="Создайте тип, чтобы классифицировать ветви." /> : (types.data ?? []).map((type) => <div key={type.branchTypeId} className="flex items-center gap-4 rounded-md border border-border/70 bg-background/40 px-4 py-4" data-testid={`row-branch-type-${type.branchTypeId}`}><div className="grid size-8 place-items-center rounded border border-primary/30 bg-primary/10 font-mono text-xs text-primary">{String(type.branchTypeId).padStart(2, '0')}</div><div className="flex-1"><p className="text-sm font-medium">{type.branchTypeDescr}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">BRANCH TYPE ID / {type.branchTypeId}</p></div><Badge variant="outline">REFERENCE</Badge></div>)}</CardContent></Card>
      <div className="sr-only">{remove.isPending ? 'busy' : ''}</div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, testId }: { label: string; value: number; onChange: (value: string) => void; options: { value: number; label: string }[]; testId: string }) {
  return <div className="space-y-2"><Label>{label}</Label><select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" data-testid={testId}>{options.length === 0 && <option value={0}>Нет доступных записей</option>}{options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></div>;
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0"><span className="font-mono text-xs text-muted-foreground">{label}</span><span className="flex items-center gap-2 font-mono text-xs text-chart-3"><span className="size-1.5 rounded-full bg-chart-3" />{value}</span></div>;
}

function LoadingState({ label }: { label: string }) {
  return <div className="flex items-center justify-center gap-3 p-12 text-sm text-muted-foreground"><RefreshCw className="size-4 animate-spin text-primary" />{label}</div>;
}

function ErrorState() {
  return <div className="flex items-start gap-3 p-8 text-sm text-destructive"><CircleAlert className="mt-0.5 size-4 shrink-0" /><div><p className="font-medium">Не удалось получить данные</p><p className="mt-1 text-destructive/80">Проверьте подключение Flask API и доступность SQLite.</p></div></div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="flex flex-col items-center justify-center px-6 py-14 text-center"><div className="mb-4 grid size-12 place-items-center rounded-full border border-border bg-muted/40 text-muted-foreground"><SlidersHorizontal className="size-5" /></div><p className="text-sm font-medium">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{description}</p></div>;
}

function NotFound() {
  return <div className="mx-auto max-w-xl py-24 text-center"><CircleAlert className="mx-auto size-8 text-primary" /><h1 className="mt-4 text-2xl font-semibold">Секция не найдена</h1><p className="mt-2 text-sm text-muted-foreground">Вернитесь к обзору схемы соединений.</p><Button className="mt-6" asChild><Link href="/">На обзор</Link></Button></div>;
}

export default App;