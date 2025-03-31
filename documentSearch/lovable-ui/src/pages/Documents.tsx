
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search, Loader2, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import api from '@/services/api';

interface DocumentSource {
  source: string;
  count: number;
}

const Documents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get query statistics to extract document information
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['queryStats'],
    queryFn: api.getQueryStats,
  });

  // Filter sources based on search term
  const filteredSources = statsData?.top_sources
    ? statsData.top_sources.filter(source => 
        source.source.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is live, so no additional action needed here
  };

  const getDocumentTypeIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'csv':
        return <FileText className="h-6 w-6 text-green-500" />;
      case 'txt':
      case 'md':
        return <FileText className="h-6 w-6 text-blue-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  const getDocumentTypeBadge = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">PDF</Badge>;
      case 'csv':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">CSV</Badge>;
      case 'txt':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">TXT</Badge>;
      case 'md':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">MD</Badge>;
      default:
        return <Badge variant="outline">Document</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            Manage and view your knowledge base documents.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Document Library</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Input
                  placeholder="Search documents..."
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
                  <p className="text-muted-foreground">Failed to load document data</p>
                </div>
              </div>
            ) : filteredSources.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">No documents found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm ? "Try a different search term" : "Upload documents to get started"}
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
              <ul className="space-y-4">
                {filteredSources.map((source, index) => (
                  <li key={index}>
                    <Card className="card-hover">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {getDocumentTypeIcon(source.source)}
                            <div>
                              <h4 className="font-medium">{source.source}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                {getDocumentTypeBadge(source.source)}
                                <span className="text-sm text-muted-foreground">
                                  Queried {source.count} time{source.count !== 1 && 's'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Documents;
