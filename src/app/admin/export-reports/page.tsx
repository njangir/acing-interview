
'use client';

import { useState } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadCloud, Loader2, AlertTriangle } from 'lucide-react';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const exportBookingsReport = httpsCallable(functions, 'exportBookingsReport');
const exportUsersReport = httpsCallable(functions, 'exportUsersReport');
const exportServicesReport = httpsCallable(functions, 'exportServicesReport');


export default function AdminExportReportsPage() {
  const { toast } = useToast();
  const [loadingStates, setLoadingStates] = useState({
    bookings: false,
    sales: false, // Sales report uses bookings data
    users: false,
    services: false,
  });
  const [error, setError] = useState<string | null>(null);

  const downloadJSON = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, (key, value) => {
      // Handle Firestore Timestamps if they appear
      if (value && typeof value === 'object' && value.hasOwnProperty('seconds') && value.hasOwnProperty('nanoseconds')) {
        return new Date(value.seconds * 1000 + value.nanoseconds / 1000000).toISOString();
      }
      return value;
    }, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (reportType: keyof typeof loadingStates, exportFunction: any, filename: string) => {
    setLoadingStates(prev => ({ ...prev, [reportType]: true }));
    setError(null);
    try {
      const result: any = await exportFunction();
      downloadJSON(result.data.data, filename); // data is nested under result.data
    } catch (err: any) {
      console.error(`Error exporting ${reportType}:`, err);
      setError(`Could not generate ${reportType} report. You might not have the required admin permissions or there was a server error.`);
      toast({
        title: "Export Failed",
        description: `Failed to generate the ${reportType} report.`,
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [reportType]: false }));
    }
  };


  return (
    <>
      <PageHeader
        title="Export Reports"
        description="Download various reports in JSON format for analysis and record-keeping."
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Export Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DownloadCloud className="mr-2 h-5 w-5 text-primary" /> Bookings Report</CardTitle>
            <CardDescription>Export a complete list of all bookings with their full details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
                onClick={() => handleExport('bookings', exportBookingsReport, 'bookings_report.json')} 
                className="w-full"
                disabled={loadingStates.bookings}
            >
              {loadingStates.bookings ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              Export Bookings (JSON)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DownloadCloud className="mr-2 h-5 w-5 text-primary" /> User Data Report</CardTitle>
            <CardDescription>Export a list of all user profiles registered in the system.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button 
                onClick={() => handleExport('users', exportUsersReport, 'user_profiles_report.json')} 
                className="w-full"
                disabled={loadingStates.users}
            >
              {loadingStates.users ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              Export User Profiles (JSON)
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DownloadCloud className="mr-2 h-5 w-5 text-primary" /> Services Report</CardTitle>
            <CardDescription>Export a list of all services configured on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button 
                onClick={() => handleExport('services', exportServicesReport, 'services_report.json')} 
                className="w-full"
                disabled={loadingStates.services}
            >
              {loadingStates.services ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              Export Services (JSON)
            </Button>
          </CardContent>
        </Card>

      </div>
    </>
  );
}
