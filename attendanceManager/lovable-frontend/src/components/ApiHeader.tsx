
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowRight, Trash, Plus } from "lucide-react";

interface ApiHeaderProps {
  url: string;
  setUrl: (url: string) => void;
  method: string;
  setMethod: (method: string) => void;
  onSendRequest: () => void;
  headers: Record<string, string>;
  setHeaders: (headers: Record<string, string>) => void;
  isLoading: boolean;
}

const HttpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

export default function ApiHeader({
  url,
  setUrl,
  method,
  setMethod,
  onSendRequest,
  headers,
  setHeaders,
  isLoading
}: ApiHeaderProps) {
  const [newHeaderKey, setNewHeaderKey] = useState("");
  const [newHeaderValue, setNewHeaderValue] = useState("");

  const addHeader = () => {
    if (!newHeaderKey.trim()) {
      toast.error("Header key cannot be empty");
      return;
    }

    setHeaders({ ...headers, [newHeaderKey]: newHeaderValue });
    setNewHeaderKey("");
    setNewHeaderValue("");
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[key];
    setHeaders(newHeaders);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle>Request</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-2">
          <div className="w-full md:w-32">
            <Label htmlFor="method">Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="method">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                {HttpMethods.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="url">URL</Label>
            <div className="flex space-x-2">
              <Input
                id="url"
                placeholder="https://api.example.com/endpoint"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button 
                type="button" 
                onClick={onSendRequest} 
                disabled={!url || isLoading}
                className="whitespace-nowrap"
              >
                {isLoading ? "Sending..." : "Send"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Headers</Label>
          </div>
          
          <div className="space-y-2 mb-3">
            {Object.entries(headers).map(([key, value]) => (
              <div key={key} className="flex space-x-2">
                <Input 
                  value={key} 
                  disabled 
                  className="flex-1 bg-secondary/50"
                />
                <Input 
                  value={value} 
                  onChange={(e) => setHeaders({...headers, [key]: e.target.value})}
                  className="flex-1"
                />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={() => removeHeader(key)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <Input 
              placeholder="Header Key" 
              value={newHeaderKey}
              onChange={(e) => setNewHeaderKey(e.target.value)}
              className="flex-1"
            />
            <Input 
              placeholder="Header Value" 
              value={newHeaderValue}
              onChange={(e) => setNewHeaderValue(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addHeader} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
