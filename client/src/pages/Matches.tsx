import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Sparkles,
  User,
  Briefcase,
  Heart,
  RefreshCcw,
} from "lucide-react";

const Matches = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [introText, setIntroText] = useState("");
  const [sending, setSending] = useState(false);
  const [sentMap, setSentMap] = useState<Record<number, boolean>>({});
  const [rematchModalOpen, setRematchModalOpen] = useState(false);
  const [rematchText, setRematchText] = useState("");
  const [rematchLoading, setRematchLoading] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [id]);

  const fetchMatches = async () => {
    try {
      const res = await api.get(`/matching/evaluate/${id}`);
      setMatches(res.data);
    } catch {
      toast.error("Failed to run AI matching engine.");
    } finally {
      setLoading(false);
    }
  };

  const openSendModal = (match: any) => {
    setSelectedMatch(match);
    setIntroText(
      match.emailIntroSnippet ||
        `Hi, we identified an exceptional profile that aligns well with your preferences. Meet ${match.name}...`,
    );
    setIsModalOpen(true);
  };

  const handleSendMatch = async () => {
    if (!selectedMatch) return;
    setSending(true);
    try {
      // Simulate sending via backend mock delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSentMap({ ...sentMap, [selectedMatch.id]: true });
      toast.success(`Match sent to client successfully!`);
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to send match.");
    } finally {
      setSending(false);
    }
  };

  // Rematch handler
  const handleRematch = async () => {
    setRematchLoading(true);
    try {
      const res = await api.post(`/matching/rematch/${id}`, {
        filter: rematchText,
      });
      setMatches(res.data);
      toast.success("Rematch completed successfully!");
      setRematchModalOpen(false);
    } catch {
      toast.error("Rematch failed.");
    } finally {
      setRematchLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500 border-green-500";
    if (score >= 70) return "text-brand-500 border-brand-500";
    return "text-amber-500 border-amber-500";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/customers/${id}`)}
              className="hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-brand-500" />
                AI Matching Engine
              </h1>
              <p className="text-slate-500">
                Ranked candidates based on deep compatibility
              </p>
            </div>
          </div>
          {/* Rematch button */}
          <Button
            variant="outline"
            size="default"
            onClick={() => setRematchModalOpen(true)}
            className="ml-2 group transition-all duration-200 hover:bg-brand-100 hover:text-brand-600 hover:shadow-md hover:scale-105"
          >
            <RefreshCcw className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
            Rematch
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card
                key={i}
                className="glass-card shadow-sm flex flex-col h-[340px]"
              >
                <CardContent className="p-6 flex-1 flex flex-col">
                  {/* Header Skeleton */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-7 w-48 bg-slate-200/60 dark:bg-slate-800" />
                      <Skeleton className="h-4 w-32 bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                      <Skeleton className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
                    </div>
                  </div>

                  {/* Gray Info Box Skeleton */}
                  <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 bg-slate-200 dark:bg-slate-700" />
                      <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 bg-slate-200 dark:bg-slate-700" />
                      <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 bg-slate-200 dark:bg-slate-700" />
                      <Skeleton className="h-4 w-16 bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>

                  {/* AI Reasoning Skeleton */}
                  <div className="mb-6 flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Skeleton className="h-3 w-3 bg-brand-100 dark:bg-brand-900" />
                      <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <div className="space-y-2 pl-1">
                      <Skeleton className="h-3 w-full bg-slate-100 dark:bg-slate-800" />
                      <Skeleton className="h-3 w-[90%] bg-slate-100 dark:bg-slate-800" />
                      <Skeleton className="h-3 w-[75%] bg-slate-100 dark:bg-slate-800" />
                    </div>
                  </div>

                  {/* Button Skeleton */}
                  <Skeleton className="h-10 w-full rounded-md bg-brand-100/50 dark:bg-brand-900/20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            No highly compatible candidates found in the current pool.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((match) => {
              const isSent = sentMap[match.id];
              return (
                <Card
                  key={match.id}
                  className="glass-card hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          {match.name}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {new Date().getFullYear() -
                            new Date(match.age).getFullYear()}{" "}
                          yrs • {match.city}
                        </p>
                      </div>
                      <div
                        className={`flex items-center justify-center w-16 h-16 rounded-full border-4 font-bold text-xl bg-white dark:bg-slate-900 shadow-sm ${getScoreColor(match.compatibilityScore)}`}
                      >
                        {match.compatibilityScore}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-400" />{" "}
                        {match.designation || "Professional"}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />{" "}
                        {match.religion}
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-slate-400" />{" "}
                        {match.dietPreference}
                      </div>
                    </div>

                    <div className="mb-6 flex-1">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-brand-500" /> AI
                        Reasoning
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                        "{match.explanation}"
                      </p>
                    </div>

                    <Button
                      className={`w-full ${isSent ? "bg-green-600 hover:bg-green-700" : "bg-brand-600 hover:bg-brand-700"} text-white shadow-md`}
                      onClick={() => !isSent && openSendModal(match)}
                      disabled={isSent}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSent ? "Match Sent" : "Send Match to Client"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-brand-500" />
              Send Match Introduction
            </DialogTitle>
            <DialogDescription>
              Review and edit the AI-generated introduction email before sending
              it to your client.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-semibold mb-2 block text-slate-700 dark:text-slate-200">
              Email Draft
            </label>
            <textarea
              className="w-full min-h-[150px] p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendMatch}
              disabled={sending || !introText.trim()}
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              {sending ? "Sending..." : "Send Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rematch Dialog */}
      <Dialog open={rematchModalOpen} onOpenChange={setRematchModalOpen}>
        <DialogContent className="sm:max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              Rematch Candidates
            </DialogTitle>
            <DialogDescription>
              Provide any additional preferences (caste, religion, etc.) to
              guide the AI matching. This will clear existing matches.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-semibold mb-2 block text-slate-700 dark:text-slate-200">
              Additional Preferences
            </label>
            <textarea
              className="w-full min-h-[80px] p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              value={rematchText}
              onChange={(e) => setRematchText(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRematchModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRematch}
              disabled={rematchLoading}
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              {rematchLoading ? "Rematching..." : "Rematch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Matches;
