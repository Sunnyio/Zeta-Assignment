
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, FileJson } from "lucide-react";

interface ResponseViewerProps {
  response: {
    data: any;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    time: number;
  } | null;
  error: string | null;
}

export default function ResponseViewer({ response, error }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState("body");
  
  if (!response && !error) {
    return (
      <Card className="min-h-[300px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileJson className="mx-auto h-12 w-12 mb-3 opacity-20" />
          <p>Send a request to see the response</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="min-h-[300px]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Response</span>
            <Badge variant="destructive">Error</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive whitespace-pre-wrap font-mono">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!response) return null;

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500 text-white";
    if (status >= 300 && status < 400) return "bg-blue-500 text-white";
    if (status >= 400 && status < 500) return "bg-yellow-500 text-black";
    if (status >= 500) return "bg-red-500 text-white";
    return "bg-gray-500 text-white";
  };

  const formatJson = (data: any) => {
    try {
      if (typeof data === 'string') {
        try {
          // Try to parse if it's a JSON string
          const parsed = JSON.parse(data);
          return JSON.stringify(parsed, null, 2);
        } catch {
          // If not JSON, return as is
          return data;
        }
      }
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  };

  return (
    <Card className="min-h-[300px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Response</span>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(response.status)}>
              {response.status} {response.statusText}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {response.time}ms
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="body" className="mt-0">
            <ScrollArea className="h-[300px] rounded-md border p-2 bg-secondary/50">
              <pre className="font-mono text-sm whitespace-pre-wrap">
                {formatJson(response.data)}
              </pre>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="headers" className="mt-0">
            <ScrollArea className="h-[300px] rounded-md border p-2 bg-secondary/50">
              <div className="font-mono text-sm">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="border-b border-border py-1">
                    <span className="font-semibold">{key}:</span> {value}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
