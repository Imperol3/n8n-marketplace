import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FormattedContent } from "@/components/formatted-content";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, X, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface EditableContentProps {
  content: string;
  onSave?: (newContent: string) => Promise<void>;
  className?: string;
  enableFormatting?: boolean;
  readOnly?: boolean;
}

export function EditableContent({
  content,
  onSave,
  className,
  enableFormatting = true,
  readOnly = false
}: EditableContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [displayContent, setDisplayContent] = useState(content);
  const [isFormatting, setIsFormatting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Update state when props change
  useEffect(() => {
    if (!isEditing) {
      setDisplayContent(content);
      setEditedContent(content);
    }
  }, [content, isEditing]);

  // Focus the textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (readOnly) return;
    setEditedContent(displayContent);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(displayContent);
  };

  const handleSave = async () => {
    try {
      if (onSave) {
        await onSave(editedContent);
      }
      
      setDisplayContent(editedContent);
      setIsEditing(false);
      
      toast({
        title: "Changes saved",
        description: "Your content has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error saving changes",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const formatContent = async () => {
    if (!editedContent) return;
    
    setIsFormatting(true);
    try {
      const res = await apiRequest("POST", "/api/tools/format-content", {
        content: editedContent
      });
      
      const data = await res.json();
      
      if (data.success) {
        setEditedContent(data.formatted);
        
        toast({
          title: data.wasConverted ? "Content Formatted" : "Minor Adjustments Applied",
          description: data.message,
        });
      } else {
        throw new Error(data.message || "Failed to format content");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to format content",
        variant: "destructive"
      });
    } finally {
      setIsFormatting(false);
    }
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-4", className)}>
        <Textarea
          ref={textareaRef}
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
          placeholder="Enter content here..."
        />
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          {enableFormatting && (
            <Button 
              variant="secondary" 
              onClick={formatContent} 
              disabled={isFormatting}
              className="ml-auto flex items-center gap-2"
            >
              {isFormatting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Formatting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Format
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      <div className="prose prose-lg max-w-none">
        <FormattedContent content={displayContent} />
      </div>
      
      {!readOnly && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleEdit}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      )}
    </div>
  );
}