
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, MessageSquare, CreditCard, Phone, Mail, Video, Calendar, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimelineEvent {
  event_type: string;
  id: number;
  actor_id: string;
  description: string;
  subject: string | null;
  metadata: any;
  event_date: string;
}

interface Cliente360TimelineProps {
  userId: string;
}

const eventIcons: Record<string, any> = {
  note: FileText,
  document: FileText,
  interaction: MessageSquare,
  plan_change: CreditCard,
  communication: Mail,
};

const eventColors: Record<string, string> = {
  note: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  document: "bg-purple-500/10 text-purple-700 border-purple-500/30",
  interaction: "bg-green-500/10 text-green-700 border-green-500/30",
  plan_change: "bg-orange-500/10 text-orange-700 border-orange-500/30",
  communication: "bg-pink-500/10 text-pink-700 border-pink-500/30",
};

const interactionTypes = [
  { value: "phone", label: "Telefone", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "video", label: "Videoconferência", icon: Video },
  { value: "meeting", label: "Reunião", icon: Calendar },
  { value: "other", label: "Outro", icon: MessageSquare },
];

export function Cliente360Timeline({ userId }: Cliente360TimelineProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: "phone",
    description: "",
  });

  const { data: timeline = [], isLoading } = useQuery<TimelineEvent[]>({
    queryKey: [`/api/admin/clients/${userId}/timeline`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/clients/${userId}/timeline`);
      return response.json();
    },
  });

  const createInteractionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/admin/clients/${userId}/interactions`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/clients/${userId}/timeline`] });
      toast({ title: "Interação registrada", description: "A interação foi registrada com sucesso" });
      setIsAddingInteraction(false);
      setNewInteraction({ type: "phone", description: "" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível registrar a interação", variant: "destructive" });
    },
  });

  const handleAddInteraction = () => {
    if (!newInteraction.description.trim()) {
      toast({ title: "Erro", description: "Digite uma descrição para a interação", variant: "destructive" });
      return;
    }

    createInteractionMutation.mutate({
      interaction_type: newInteraction.type,
      description: newInteraction.description,
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando timeline...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Timeline de Atividades</h3>
        <Dialog open={isAddingInteraction} onOpenChange={setIsAddingInteraction}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Interação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nova Interação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Interação</Label>
                <Select value={newInteraction.type} onValueChange={(value) => setNewInteraction({ ...newInteraction, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interactionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva o que foi discutido ou acordado..."
                  value={newInteraction.description}
                  onChange={(e) => setNewInteraction({ ...newInteraction, description: e.target.value })}
                  rows={4}
                />
              </div>
              <Button onClick={handleAddInteraction} className="w-full" disabled={createInteractionMutation.isPending}>
                {createInteractionMutation.isPending ? "Salvando..." : "Salvar Interação"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {timeline.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma atividade registrada ainda
            </CardContent>
          </Card>
        ) : (
          timeline.map((event) => {
            const Icon = eventIcons[event.event_type] || MessageSquare;
            return (
              <Card key={`${event.event_type}-${event.id}`} className="border-l-4">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${eventColors[event.event_type] || "bg-gray-500/10"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={eventColors[event.event_type]}>
                          {event.event_type.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {event.subject && (
                        <p className="font-medium text-sm mb-1">{event.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
