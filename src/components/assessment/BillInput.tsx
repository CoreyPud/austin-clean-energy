import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillUpload from "@/components/assessment/BillUpload";

interface Props {
  monthlyBill: number;
  onMonthlyBillChange: (v: number) => void;
  onUploadedKwhChange: (kwh: number[] | null) => void;
}

const BillInput = ({ monthlyBill, onMonthlyBillChange, onUploadedKwhChange }: Props) => (
  <Card className="border-2 border-border shadow-md">
    <CardContent className="pt-6 pb-6">
      <Tabs
        defaultValue="estimate"
        onValueChange={(v) => { if (v === "estimate") onUploadedKwhChange(null); }}
      >
        <TabsList className="w-full mb-4">
          <TabsTrigger value="estimate" className="flex-1">Estimate</TabsTrigger>
          <TabsTrigger value="upload" className="flex-1">Upload bill</TabsTrigger>
        </TabsList>

        <TabsContent value="estimate">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Monthly electricity bill</span>
            <span className="font-semibold">${monthlyBill}</span>
          </div>
          <Slider
            min={50} max={600} step={10}
            value={[monthlyBill]}
            onValueChange={([v]) => onMonthlyBillChange(v)}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>$50</span><span>$600</span>
          </div>
        </TabsContent>

        <TabsContent value="upload">
          <BillUpload onResult={(kwh) => onUploadedKwhChange(kwh)} />
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
);

export default BillInput;
