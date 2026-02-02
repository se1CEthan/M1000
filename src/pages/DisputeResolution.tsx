import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, AlertTriangle, FileText, MessageSquare, Clock, 
  DollarSign, User, Shield, CheckCircle, XCircle, Upload,
  Calendar, Scale, Gavel, Eye, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContractService } from '@/lib/freelancing-service';
import { DisputeService } from '@/lib/dispute-service';
import type { Contract, Dispute } from '@/types/freelancing';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const DISPUTE_REASONS = [
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'scope_change', label: 'Scope Change' },
  { value: 'quality_issue', label: 'Quality of Work' },
  { value: 'communication', label: 'Communication Problems' },
  { value: 'deadline_missed', label: 'Missed Deadline' },
  { value: 'contract_breach', label: 'Contract Breach' },
  { value: 'other', label: 'Other' }
];

export default function DisputeResolution() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [disputeForm, setDisputeForm] = useState({
    reason: '',
    description: '',
    amount_disputed: undefined as number | undefined,
    evidence: [] as File[]
  });

  const [responseForm, setResponseForm] = useState({
    message: '',
    evidence: [] as File[]
  });

  useEffect(() => {
    if (contractId) {
      loadContractData();
    }
  }, [contractId]);

  const loadContractData = async () => {
    try {
      setLoading(true);
      const contractData = await ContractService.getById(contractId!);
      if (!contractData) {
        toast({
          title: 'Error',
          description: 'Contract not found',
          variant: 'destructive'
        });
        navigate('/freelancer/contracts');
        return;
      }
      
      setContract(contractData);
      
      // Load existing disputes for this contract
      const disputes = await DisputeService.getByContractId(contractId!);
      if (disputes.length > 0) {
        setDispute(disputes[0]); // Get the most recent dispute
      }
    } catch (error) {
      console.error('Error loading contract:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contract details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contract || !disputeForm.reason || !disputeForm.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Create dispute using DisputeService
      const newDispute = await DisputeService.create({
        contract_id: contract.id,
        reason: disputeForm.reason,
        description: disputeForm.description,
        amount_disputed: disputeForm.amount_disputed,
        evidence: disputeForm.evidence
      });
      
      toast({
        title: 'Dispute Submitted',
        description: 'Your dispute has been submitted and will be reviewed by our team.',
      });
      
      setDispute(newDispute);
      setActiveTab('dispute');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit dispute',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'dispute' | 'response') => {
    const files = Array.from(e.target.files || []);
    if (type === 'dispute') {
      setDisputeForm(prev => ({ ...prev, evidence: [...prev.evidence, ...files] }));
    } else {
      setResponseForm(prev => ({ ...prev, evidence: [...prev.evidence, ...files] }));
    }
  };

  const removeFile = (index: number, type: 'dispute' | 'response') => {
    if (type === 'dispute') {
      setDisputeForm(prev => ({
        ...prev,
        evidence: prev.evidence.filter((_, i) => i !== index)
      }));
    } else {
      setResponseForm(prev => ({
        ...prev,
        evidence: prev.evidence.filter((_, i) => i !== index)
      }));
    }
  };

  const getDisputeStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-500';
      case 'in_review': return 'bg-blue-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!contract) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-semibold mb-2">Contract Not Found</h3>
              <p className="text-muted-foreground">The contract you're looking for doesn't exist or you don't have access to it.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={item} className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/freelancer/contracts/${contractId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Contract
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dispute Resolution</h1>
              <p className="text-muted-foreground mt-2">
                Resolve issues with "{contract.title}"
              </p>
            </div>
          </motion.div>

          {/* Contract Summary */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Contract Overview</span>
                  {dispute && (
                    <Badge className={getDisputeStatusColor(dispute.status)}>
                      Dispute {dispute.status}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Project:</span>
                      <p className="font-medium">{contract.title}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Client:</span>
                      <p className="font-medium">{contract.business?.company_name}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Contract Value:</span>
                      <p className="font-medium">
                        {contract.contract_type === 'fixed' 
                          ? `$${contract.total_amount?.toLocaleString()}` 
                          : `$${contract.hourly_rate}/hr`
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant="outline">{contract.status}</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Start Date:</span>
                      <p className="font-medium">
                        {new Date(contract.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Milestones:</span>
                      <p className="font-medium">
                        {contract.milestones.filter(m => m.status === 'completed').length} / {contract.milestones.length}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div variants={item}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="create">File Dispute</TabsTrigger>
                <TabsTrigger value="dispute" disabled={!dispute}>
                  Active Dispute
                </TabsTrigger>
                <TabsTrigger value="resolution">Resolution Center</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Dispute Process */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Scale className="h-5 w-5" />
                        How Disputes Work
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                            1
                          </div>
                          <div>
                            <h4 className="font-medium">File a Dispute</h4>
                            <p className="text-sm text-muted-foreground">
                              Describe the issue and provide evidence
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                            2
                          </div>
                          <div>
                            <h4 className="font-medium">Other Party Response</h4>
                            <p className="text-sm text-muted-foreground">
                              They have 48 hours to respond
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                            3
                          </div>
                          <div>
                            <h4 className="font-medium">Mediation</h4>
                            <p className="text-sm text-muted-foreground">
                              Our team reviews and mediates
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                            4
                          </div>
                          <div>
                            <h4 className="font-medium">Resolution</h4>
                            <p className="text-sm text-muted-foreground">
                              Final decision within 5-7 business days
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Common Issues */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Common Issues
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {DISPUTE_REASONS.map((reason) => (
                          <div key={reason.value} className="p-3 border rounded-lg">
                            <h4 className="font-medium text-sm">{reason.label}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {reason.value === 'payment_issue' && 'Issues with payment processing or amounts'}
                              {reason.value === 'scope_change' && 'Disagreements about project scope changes'}
                              {reason.value === 'quality_issue' && 'Concerns about work quality or deliverables'}
                              {reason.value === 'communication' && 'Poor communication or unresponsiveness'}
                              {reason.value === 'deadline_missed' && 'Missed deadlines or timeline issues'}
                              {reason.value === 'contract_breach' && 'Violation of contract terms'}
                              {reason.value === 'other' && 'Other issues not listed above'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tips for Resolution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tips for Successful Resolution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <MessageSquare className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                        <h4 className="font-medium mb-2">Communicate First</h4>
                        <p className="text-sm text-muted-foreground">
                          Try to resolve issues through direct communication before filing a dispute
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <FileText className="h-8 w-8 mx-auto mb-3 text-green-500" />
                        <h4 className="font-medium mb-2">Document Everything</h4>
                        <p className="text-sm text-muted-foreground">
                          Keep records of all communications, deliverables, and agreements
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <Shield className="h-8 w-8 mx-auto mb-3 text-purple-500" />
                        <h4 className="font-medium mb-2">Be Professional</h4>
                        <p className="text-sm text-muted-foreground">
                          Maintain professionalism throughout the dispute process
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Create Dispute Tab */}
              <TabsContent value="create" className="space-y-6">
                {dispute ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                      <h3 className="text-lg font-semibold mb-2">Dispute Already Active</h3>
                      <p className="text-muted-foreground">
                        There is already an active dispute for this contract.
                      </p>
                      <Button 
                        className="mt-4" 
                        onClick={() => setActiveTab('dispute')}
                      >
                        View Active Dispute
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>File a Dispute</CardTitle>
                      <CardDescription>
                        Provide detailed information about the issue you're experiencing
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmitDispute} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="reason">Dispute Reason *</Label>
                          <Select value={disputeForm.reason} onValueChange={(value) => setDisputeForm(prev => ({ ...prev, reason: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select the reason for your dispute" />
                            </SelectTrigger>
                            <SelectContent>
                              {DISPUTE_REASONS.map((reason) => (
                                <SelectItem key={reason.value} value={reason.value}>
                                  {reason.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="amount_disputed">Amount in Dispute (Optional)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="amount_disputed"
                              type="number"
                              placeholder="0.00"
                              value={disputeForm.amount_disputed || ''}
                              onChange={(e) => setDisputeForm(prev => ({ ...prev, amount_disputed: parseFloat(e.target.value) || undefined }))}
                              className="pl-10"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            If applicable, specify the amount of money involved in this dispute
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Detailed Description *</Label>
                          <Textarea
                            id="description"
                            placeholder="Please provide a detailed explanation of the issue, including:
- What happened and when
- What you expected vs. what actually occurred
- Any attempts to resolve the issue
- How you would like this resolved"
                            value={disputeForm.description}
                            onChange={(e) => setDisputeForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={8}
                            className="resize-none"
                          />
                          <p className="text-xs text-muted-foreground">
                            {disputeForm.description.length}/2000 characters
                          </p>
                        </div>

                        {/* Evidence Upload */}
                        <div className="space-y-4">
                          <Label>Supporting Evidence</Label>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Upload screenshots, documents, or other evidence
                            </p>
                            <input
                              type="file"
                              multiple
                              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                              onChange={(e) => handleFileUpload(e, 'dispute')}
                              className="hidden"
                              id="dispute-evidence"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('dispute-evidence')?.click()}
                            >
                              Choose Files
                            </Button>
                          </div>

                          {disputeForm.evidence.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm">Uploaded Files:</Label>
                              {disputeForm.evidence.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <span className="text-sm">{file.name}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index, 'dispute')}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Important Notes:</h4>
                              <ul className="text-sm text-yellow-800 dark:text-yellow-200 mt-2 space-y-1">
                                <li>• Filing a dispute will pause the contract until resolved</li>
                                <li>• Both parties will be notified and can provide their side</li>
                                <li>• Our mediation team will review all evidence fairly</li>
                                <li>• False or frivolous disputes may result in account penalties</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab('overview')}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={submitting || !disputeForm.reason || !disputeForm.description.trim()}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                          >
                            {submitting ? 'Filing Dispute...' : 'File Dispute'}
                            <Gavel className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Active Dispute Tab */}
              <TabsContent value="dispute" className="space-y-6">
                {dispute ? (
                  <>
                    {/* Dispute Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Dispute Status</span>
                          <Badge className={getDisputeStatusColor(dispute.status)}>
                            {dispute.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Filed:</span>
                              <p className="font-medium">
                                {new Date(dispute.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Reason:</span>
                              <p className="font-medium">
                                {DISPUTE_REASONS.find(r => r.value === dispute.reason)?.label}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Amount:</span>
                              <p className="font-medium">
                                {dispute.amount_disputed ? `$${dispute.amount_disputed.toLocaleString()}` : 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Progress Timeline */}
                          <div className="space-y-3">
                            <h4 className="font-medium">Resolution Progress</h4>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <div>
                                  <p className="font-medium">Dispute Filed</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(dispute.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-yellow-500" />
                                <div>
                                  <p className="font-medium">Awaiting Response</p>
                                  <p className="text-sm text-muted-foreground">
                                    Other party has 48 hours to respond
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <Eye className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-muted-foreground">Under Review</p>
                                  <p className="text-sm text-muted-foreground">
                                    Our team will review all evidence
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Dispute Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Dispute Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Your Statement:</h4>
                            <div className="p-4 bg-muted/50 rounded-lg">
                              <p className="text-sm whitespace-pre-wrap">{dispute.description}</p>
                            </div>
                          </div>

                          {dispute.resolution && (
                            <div>
                              <h4 className="font-medium mb-2">Resolution:</h4>
                              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                <p className="text-sm">{dispute.resolution}</p>
                                {dispute.resolved_at && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Resolved on {new Date(dispute.resolved_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Communication */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Dispute Communication</CardTitle>
                        <CardDescription>
                          Messages and updates related to this dispute
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No messages yet</p>
                            <p className="text-sm">Updates will appear here as the dispute progresses</p>
                          </div>

                          {dispute.status === 'open' && (
                            <div className="border-t pt-4">
                              <form 
                                className="space-y-3"
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  if (!responseForm.message.trim()) return;
                                  
                                  try {
                                    await DisputeService.addResponse(dispute.id, {
                                      dispute_id: dispute.id,
                                      message: responseForm.message,
                                      evidence: responseForm.evidence
                                    });
                                    
                                    setResponseForm({ message: '', evidence: [] });
                                    toast({
                                      title: 'Message Sent',
                                      description: 'Your message has been added to the dispute.'
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: 'Error',
                                      description: error.message || 'Failed to send message',
                                      variant: 'destructive'
                                    });
                                  }
                                }}
                              >
                                <Textarea
                                  placeholder="Add a message or additional information..."
                                  value={responseForm.message}
                                  onChange={(e) => setResponseForm(prev => ({ ...prev, message: e.target.value }))}
                                  rows={3}
                                />
                                <div className="flex justify-end">
                                  <Button size="sm" type="submit" disabled={!responseForm.message.trim()}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Message
                                  </Button>
                                </div>
                              </form>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Active Dispute</h3>
                      <p className="text-muted-foreground">
                        There is no active dispute for this contract.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Resolution Center Tab */}
              <TabsContent value="resolution" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Resolution Center
                    </CardTitle>
                    <CardDescription>
                      Resources and support for resolving disputes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Self-Resolution Tools</h4>
                        <div className="space-y-3">
                          <Button variant="outline" className="w-full justify-start">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Direct Message Client
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <FileText className="h-4 w-4 mr-2" />
                            Review Contract Terms
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Mediation Call
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Get Help</h4>
                        <div className="space-y-3">
                          <Button variant="outline" className="w-full justify-start">
                            <User className="h-4 w-4 mr-2" />
                            Contact Support
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <FileText className="h-4 w-4 mr-2" />
                            Dispute Guidelines
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <Scale className="h-4 w-4 mr-2" />
                            Legal Resources
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Prevention Tips
                      </h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Clearly define project scope and deliverables upfront</li>
                        <li>• Set realistic timelines and communicate regularly</li>
                        <li>• Use milestones to track progress and payments</li>
                        <li>• Document all changes and agreements in writing</li>
                        <li>• Address concerns early before they become disputes</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}