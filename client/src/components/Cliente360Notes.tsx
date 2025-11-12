
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientNote {
  id: number;
  user_id: string;
  admin_id: string;
  content: string;
  created_at: string;
}

interface Cliente360NotesProps {
  userId: string;
}

export function Cliente360Notes({ userId }: Cliente360NotesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<ClientNote | null>(null);
  const [noteContent, setNoteContent] = useState("");

  const { data: notes = [], isLoading } = useQuery<ClientNote[]>({
    queryKey: [`/api/admin/clients/${userId}/notes`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/clients/${userId}/notes`);
      return response.json();
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/admin/clients/${userId}/notes`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/clients/${userId}/notes`] });
      toast({ title: "Nota criada", description: "A nota foi criada com sucesso" });
      setIsAddingNote(false);
      setNoteContent("");
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const response = await apiRequest("PUT", `/api/admin/clients/notes/${id}`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/clients/${userId}/notes`] });
      toast({ title: "Nota atualizada", description: "A nota foi atualizada com sucesso" });
      setEditingNote(null);
      setNoteContent("");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/clients/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/clients/${userId}/notes`] });
      toast({ title: "Nota deletada", description: "A nota foi removida com sucesso" });
    },
  });

  const handleSaveNote = () => {
    if (!noteContent.trim()) {
      toast({ title: "Erro", description: "Digite o conteúdo da nota", variant: "destructive" });
      return;
    }

    if (editingNote) {
      updateNoteMutation.mutate({ id: editingNote.id, content: noteContent });
    } else {
      createNoteMutation.mutate(noteContent);
    }
  };

  const handleEdit = (note: ClientNote) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setIsAddingNote(true);
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando notas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notas Internas</h3>
        <Dialog open={isAddingNote} onOpenChange={(open) => {
          setIsAddingNote(open);
          if (!open) {
            setEditingNote(null);
            setNoteContent("");
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Nota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNote ? "Editar Nota" : "Nova Nota"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Digite a nota..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={6}
              />
              <Button onClick={handleSaveNote} className="w-full">
                {editingNote ? "Atualizar Nota" : "Salvar Nota"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma nota registrada ainda</p>
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(note)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm("Deseja realmente deletar esta nota?")) {
                        deleteNoteMutation.mutate(note.id);
                      }
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
