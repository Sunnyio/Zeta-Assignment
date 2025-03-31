
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Search, ChevronLeft, ChevronRight, Loader2, AlertCircle, Check, X } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import api from '@/services/api';

const PAGE_SIZE = 10;

const History: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['queryHistory', page, PAGE_SIZE],
    queryFn: () => api.getQueryHistory(PAGE_SIZE, page * PAGE_SIZE),
  });

  const filteredRecords = data?.records
    ? data.records.filter(record =>
        record.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.response && record.response.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); // Reset pagination when searching
  };

  const handleViewDetails = (record: any) => {
    setSelectedRecord(record);
    setSelectedQuery(record.id);
  };

  const handleCloseDialog = () => {
    setSelectedQuery(null);
    setSelectedRecord(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Query History</h2>
          <p className="text-muted-foreground">
            View past questions and AI responses from your knowledge base.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Input
                  placeholder="Search queries and responses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </form>

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-10">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">Failed to load query history</p>
                </div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-10">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">No queries found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm ? "Try a different search term" : "Submit queries to see history"}
                </p>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="pb-3 pl-4">Timestamp</th>
                        <th className="pb-3">Query</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Response Time</th>
                        <th className="pb-3 pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredRecords.map((record, index) => (
                        <tr key={index} className="hover:bg-muted/50">
                          <td className="py-3 pl-4 whitespace-nowrap">
                            {format(parseISO(record.timestamp), 'MMM dd, yyyy HH:mm')}
                          </td>
                          <td className="py-3 max-w-[20rem]">
                            <div className="truncate" title={record.query}>
                              {record.query}
                            </div>
                          </td>
                          <td className="py-3">
                            {record.success ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                <Check className="mr-1 h-3 w-3" /> Success
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200">
                                <X className="mr-1 h-3 w-3" /> Failed
                              </Badge>
                            )}
                          </td>
                          <td className="py-3">
                            {record.response_time.toFixed(2)}s
                          </td>
                          <td className="py-3 pr-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(record)}
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page + 1} of {Math.max(1, totalPages)}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Query Details Dialog */}
        <Dialog open={selectedQuery !== null} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            {selectedRecord && (
              <>
                <DialogHeader>
                  <DialogTitle>Query Details</DialogTitle>
                  <DialogDescription>
                    {format(parseISO(selectedRecord.timestamp), 'PPpp')}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Query</h4>
                    <p className="p-3 bg-muted rounded-md">{selectedRecord.query}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Response</h4>
                    <div className="p-3 bg-muted rounded-md whitespace-pre-wrap font-mono text-sm">
                      {selectedRecord.response}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <h4 className="text-sm font-medium">Sources:</h4>
                    {selectedRecord.sources.map((source: string, index: number) => (
                      <Badge key={index} variant="secondary">{source}</Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="font-medium">Status: </span>
                      {selectedRecord.success ? 'Success' : 'Failed'}
                    </div>
                    <div>
                      <span className="font-medium">Response Time: </span>
                      {selectedRecord.response_time.toFixed(2)}s
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default History;
