
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash } from "lucide-react";

interface RequestBodyProps {
  method: string;
  body: string;
  setBody: (body: string) => void;
  formData: Record<string, string>;
  setFormData: (data: Record<string, string>) => void;
  contentType: string;
  setContentType: (type: string) => void;
}

export default function RequestBody({
  method,
  body,
  setBody,
  formData,
  setFormData,
  contentType,
  setContentType,
}: RequestBodyProps) {
  const [newFormKey, setNewFormKey] = useState("");
  const [newFormValue, setNewFormValue] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const bodySupportedMethods = ["POST", "PUT", "PATCH"];
  
  if (!bodySupportedMethods.includes(method)) {
    return null;
  }

  const handleBodyChange = (value: string) => {
    setBody(value);
    
    // Validate JSON when in JSON mode
    if (contentType === "json") {
      try {
        if (value.trim()) {
          JSON.parse(value);
        }
        setJsonError(null);
      } catch (e) {
        setJsonError((e as Error).message);
      }
    }
  };

  const addFormField = () => {
    if (!newFormKey.trim()) return;
    setFormData({ ...formData, [newFormKey]: newFormValue });
    setNewFormKey("");
    setNewFormValue("");
  };

  const removeFormField = (key: string) => {
    const newData = { ...formData };
    delete newData[key];
    setFormData(newData);
  };

  // Update body when form data changes
  useEffect(() => {
    if (contentType === "form") {
      try {
        setBody(JSON.stringify(formData, null, 2));
      } catch (e) {
        console.error("Error stringifying form data", e);
      }
    }
  }, [formData, contentType]);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle>Request Body</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={contentType} onValueChange={setContentType} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="form">Form</TabsTrigger>
          </TabsList>
          
          <TabsContent value="json" className="space-y-4">
            <div>
              <Label htmlFor="body">JSON Body</Label>
              <Textarea
                id="body"
                placeholder='{"key": "value"}'
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
                className="font-mono h-40"
              />
              {jsonError && (
                <p className="text-destructive text-sm mt-1">{jsonError}</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="form" className="space-y-4">
            <div className="space-y-3">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} className="flex space-x-2">
                  <Input
                    value={key}
                    disabled
                    className="flex-1 bg-secondary/50"
                  />
                  <Input
                    value={value}
                    onChange={(e) => setFormData({...formData, [key]: e.target.value})}
                    className="flex-1"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeFormField(key)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="flex space-x-2">
                <Input
                  placeholder="Key"
                  value={newFormKey}
                  onChange={(e) => setNewFormKey(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Value"
                  value={newFormValue}
                  onChange={(e) => setNewFormValue(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addFormField} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
