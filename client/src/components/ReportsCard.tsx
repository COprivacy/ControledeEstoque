import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

interface ReportsCardProps {
  dailyTotal?: number;
  weeklyTotal?: number;
  onFilter?: (startDate: string, endDate: string) => void;
}

export default function ReportsCard({ 
  dailyTotal = 0, 
  weeklyTotal = 0,
  onFilter 
}: ReportsCardProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleFilter = () => {
    if (startDate && endDate) {
      onFilter?.(startDate, endDate);
      console.log("Filtrar vendas:", { startDate, endDate });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground" data-testid="text-daily-total">
              R$ {dailyTotal.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground" data-testid="text-weekly-total">
              R$ {weeklyTotal.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtrar por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Data Inicial</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10"
                    data-testid="input-start-date"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date">Data Final</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10"
                    data-testid="input-end-date"
                  />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleFilter} 
              disabled={!startDate || !endDate}
              data-testid="button-filter"
            >
              Aplicar Filtro
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
