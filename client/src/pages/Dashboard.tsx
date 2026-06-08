import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  LogOut,
  Search,
  Users,
  Activity,
  CheckCircle,
  Clock,
  ChevronRight,
} from "lucide-react";

const getInitials = (name: string) => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDashboardData();
    }, 300); // 300ms debounce on search keystrokes to prevent backend spam

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchQuery]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, clientsRes] = await Promise.all([
        api.get("/customers/stats"),
        api.get(
          `/customers/all?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`,
        ),
      ]);
      setStats(statsRes.data.stats);
      setCustomers(clientsRes.data.data);
      setTotalPages(clientsRes.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {}
    localStorage.removeItem("token");
    localStorage.removeItem("matchmaker");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Welcome back to the Matchmaker Panel
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="self-start md:self-auto shadow-sm cursor-pointer bg-slate-900 dark:bg-slate-800 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>

        {/* Stats Overview */}
        {!stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Total Pool
                </CardTitle>
                <Users className="w-4 h-4 text-brand-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.poolSize}</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Active Searching
                </CardTitle>
                <Activity className="w-4 h-4 text-brand-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.activeCustomers}
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Successfully Matched
                </CardTitle>
                <CheckCircle className="w-4 h-4 text-brand-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.matchedCustomers}
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  On Hold
                </CardTitle>
                <Clock className="w-4 h-4 text-brand-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.onHoldCustomers}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Client List Section - Paginated Table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              Your Managed Clients
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search clients..."
                className="pl-9 glass-card border-none"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to page 1 on new search
                }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-4 px-6">
                      Client Name
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-300 px-6">
                      Age
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-300 px-6">
                      Location
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-300 px-6">
                      Marital Status
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-300 px-6">
                      Journey
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-300 px-6">
                      Profile
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(itemsPerPage)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-8" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-8 rounded-full inline-block" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : customers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-slate-500"
                      >
                        No clients found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((client) => (
                      <TableRow
                        key={client.id}
                        className="cursor-pointer bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 group border-b border-slate-100 dark:border-slate-800 "
                        onClick={() => navigate(`/customers/${client.id}`)}
                      >
                        <TableCell className="font-medium text-slate-900 dark:text-slate-100 py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-800/20 text-brand-700 dark:text-brand-300 flex items-center justify-center text-sm font-bold shadow-sm ring-1 ring-brand-200/50 dark:ring-brand-700/30 group-hover:scale-105 transition-transform duration-200">
                              {getInitials(client.name)}
                            </div>
                            <span className="group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors text-[15px]">
                              {client.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 dark:text-slate-400 px-6">
                          {client.age}
                        </TableCell>
                        <TableCell className="text-slate-500 dark:text-slate-400 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-brand-300 dark:group-hover:bg-brand-600 transition-colors"></div>
                            {client.city}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 dark:text-slate-400 px-6">
                          {client.maritalStatus}
                        </TableCell>
                        <TableCell className="px-6">
                          <Badge
                            variant="outline"
                            className={`px-3 py-1.5 text-sm rounded-full font-medium border shadow-sm transition-colors ${
                              client.journeyStatus === "Searching Matches"
                                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full mr-2 inline-block ${
                                client.journeyStatus === "Searching Matches"
                                  ? "bg-rose-500 animate-pulse"
                                  : "bg-emerald-500"
                              }`}
                            ></span>
                            {client.journeyStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label="View client details"
                                className="rounded-full transition-all duration-200 flex items-center gap-1.5 ml-auto bg-slate-50 text-slate-500 hover:bg-brand-50 hover:text-brand-600 hover:shadow-sm hover:scale-105 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-brand-900/30 dark:hover:text-brand-300 border border-transparent hover:border-brand-100 dark:hover:border-brand-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                              >
                                <span className="font-semibold text-[13px]">
                                  View Details
                                </span>
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((p) => Math.max(1, p - 1));
                        }}
                      />
                    </PaginationItem>

                    {[...Array(totalPages)].map((_, idx) => (
                      <PaginationItem key={idx}>
                        <PaginationLink
                          className="cursor-pointer"
                          isActive={currentPage === idx + 1}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(idx + 1);
                          }}
                        >
                          {idx + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
