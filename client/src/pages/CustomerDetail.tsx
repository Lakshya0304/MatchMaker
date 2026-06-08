import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, MessageSquarePlus, Sparkles, Loader2 } from 'lucide-react';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      const res = await api.get(`/customers/${id}`);
      setClient(res.data);
    } catch (error) {
      toast.error('Failed to load customer profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await api.patch(`/customers/${id}/status`, { status: newStatus });
      setClient({ ...client, journeyStatus: newStatus });
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      const res = await api.post(`/customers/${id}/notes`, { content: newNote });
      setClient({
        ...client,
        notes: [res.data.note, ...(client.notes || [])]
      });
      setNewNote('');
      toast.success('Note added');
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[500px] md:col-span-2 rounded-3xl" />
          <Skeleton className="h-[500px] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!client) return <div className="p-8 text-center text-red-500 font-medium">Profile not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50/50 via-slate-50 to-slate-100/80 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Premium Header Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full shadow-sm border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                {client.firstName} {client.lastName}
                <Badge variant="outline" className="bg-brand-100 text-brand-700 border-brand-200 px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
                  {client.age ? new Date().getFullYear() - new Date(client.age).getFullYear() : 'N/A'} yrs
                </Badge>
              </h1>
              <p className="text-slate-500 font-medium mt-1">{client.city}, {client.country}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <Select
              value={client.journeyStatus}
              onValueChange={handleStatusChange}
              disabled={updatingStatus}
            >
              <SelectTrigger className={`w-full sm:w-[220px] bg-white dark:bg-slate-900 border-slate-200 rounded-full shadow-sm font-medium focus:ring-brand-500 ${updatingStatus ? 'opacity-50' : ''}`}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 shadow-xl bg-white dark:bg-slate-900 relative z-50">
                <SelectItem value="Onboarding">Onboarding</SelectItem>
                <SelectItem value="Profile Verified">Profile Verified</SelectItem>
                <SelectItem value="Searching Matches">Searching Matches</SelectItem>
                <SelectItem value="Intro Sent">Intro Sent</SelectItem>
                <SelectItem value="Matched">Matched</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Button
              disabled={updatingStatus}
              className={`bg-brand-600 hover:bg-brand-700 text-white rounded-full px-6 shadow-md shadow-brand-500/20 whitespace-nowrap transition-all font-semibold min-w-[120px] ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => navigate(`/customers/${client.id}/matches`)}
            >
              {updatingStatus ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {updatingStatus ? 'Saving...' : 'Find Matches'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Info Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden">
              <Tabs defaultValue="basic" className="w-full">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 px-8 py-6">
                  <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl inline-flex shadow-inner">
                    <TabsTrigger value="basic" className="rounded-xl px-6 py-2.5 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-brand-700 dark:data-[state=active]:bg-slate-900 transition-all">Basic Info</TabsTrigger>
                    <TabsTrigger value="career" className="rounded-xl px-6 py-2.5 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-brand-700 dark:data-[state=active]:bg-slate-900 transition-all">Career & Edu</TabsTrigger>
                    <TabsTrigger value="lifestyle" className="rounded-xl px-6 py-2.5 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-brand-700 dark:data-[state=active]:bg-slate-900 transition-all">Lifestyle</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="p-8">
                  <TabsContent value="basic" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Gender</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.gender}</div></div>
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Marital Status</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.maritalStatus}</div></div>
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Height</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.heightCm} cm</div></div>
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Religion</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.religion}</div></div>
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Caste</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.caste || 'N/A'}</div></div>
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Mother Tongue</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.motherTongue}</div></div>
                    </div>
                  </TabsContent>
                  <TabsContent value="career" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Company</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.currentCompany || 'N/A'}</div></div>
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Designation</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.designation || 'N/A'}</div></div>
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Annual Income</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">₹ {(Number(client.annualIncomeInr) / 100000).toFixed(1)} LPA</div></div>
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Education</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.degree || 'N/A'}</div></div>
                      <div className="col-span-1 sm:col-span-2 space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">College</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.ugCollege || 'N/A'}</div></div>
                    </div>
                  </TabsContent>
                  <TabsContent value="lifestyle" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Diet Preference</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.dietPreference}</div></div>
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Family Values</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.familyValues}</div></div>
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Wants Kids</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.wantKids}</div></div>
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Open to Relocate</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.openToRelocate}</div></div>
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Open to Pets</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.openToPets}</div></div>
                      <div className="space-y-1"><span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Siblings</span> <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{client.siblings || 'None'}</div></div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Sidebar - Internal Notes */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] flex flex-col h-[600px] overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 px-6 py-5">
                <CardTitle className="text-lg font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100 tracking-tight">
                  <div className="p-2 bg-brand-100 text-brand-600 rounded-xl">
                    <MessageSquarePlus className="w-5 h-5" />
                  </div>
                  Internal Call Notes
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30 dark:bg-transparent scroll-smooth">
                {client.notes && client.notes.length > 0 ? (
                  client.notes.map((note: any) => (
                    <div key={note.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm animate-in slide-in-from-right-4 duration-300">
                      <p className="text-[15px] text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">{note.content}</p>
                      <div className="flex justify-between items-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">{note.matchmaker?.name || 'Agent'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                    <MessageSquarePlus className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                    <p className="text-sm font-medium">No notes added yet.</p>
                  </div>
                )}
              </CardContent>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <form onSubmit={handleAddNote} className="flex gap-3">
                  <Input 
                    placeholder="Type a new note..." 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border-transparent focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl h-11 px-4 shadow-inner"
                  />
                  <Button type="submit" disabled={addingNote || !newNote.trim()} className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl h-11 px-6 shadow-md transition-all font-semibold">
                    Add
                  </Button>
                </form>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
