
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/services/api';

const Query: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<string[]>([]);

  const queryMutation = useMutation({
    mutationFn: api.queryKnowledge,
    onSuccess: (data) => {
      setResponse(data.response);
      setSources(data.sources);
      toast.success('Query processed successfully');
    },
    onError: (error) => {
      toast.error('Error processing query');
      console.error('Query error:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error('Please enter a question');
      return;
    }
    queryMutation.mutate(query);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Query Knowledge Base</h2>
          <p className="text-muted-foreground">
            Ask questions about your uploaded documents.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ask a Question</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea 
                placeholder="Ask something about your documents..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[100px]"
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={queryMutation.isPending}
              >
                {queryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Query
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {(response || queryMutation.isPending) && (
          <Card>
            <CardHeader>
              <CardTitle>Answer</CardTitle>
            </CardHeader>
            <CardContent>
              {queryMutation.isPending ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="prose max-w-none">
                    <p>{response}</p>
                  </div>
                  
                  {sources.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Sources:</h4>
                      <ul className="list-disc list-inside">
                        {sources.map((source, i) => (
                          <li key={i} className="text-muted-foreground">
                            {source}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Query;
