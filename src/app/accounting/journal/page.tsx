import PageHeader from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const sampleEntries = [
    { id: 1, date: '2023-10-01', number: 'JV-001', description: 'إثبات فاتورة مبيعات العميل أ', debit: 5000, credit: 0, account: 'حسابات العملاء' },
    { id: 2, date: '2023-10-01', number: 'JV-001', description: 'إثبات فاتورة مبيعات العميل أ', debit: 0, credit: 5000, account: 'إيرادات المبيعات' },
    { id: 3, date: '2023-10-02', number: 'JV-002', description: 'تسجيل فاتورة شراء من المورد ب', debit: 3000, credit: 0, account: 'المخزون' },
    { id: 4, date: '2023-10-02', number: 'JV-002', description: 'تسجيل فاتورة شراء من المورد ب', debit: 0, credit: 3000, account: 'حسابات الموردين' },
]


export default function JournalPage() {
  return (
    <>
      <PageHeader title="قيود اليومية" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>سجل قيود اليومية</CardTitle>
            <CardDescription>
              عرض لجميع قيود اليومية التي تم إنشاؤها تلقائيًا أو يدويًا.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[120px]">التاريخ</TableHead>
                        <TableHead className="w-[120px]">رقم القيد</TableHead>
                        <TableHead>البيان</TableHead>
                        <TableHead>الحساب</TableHead>
                        <TableHead className="text-center w-[150px]">مدين</TableHead>
                        <TableHead className="text-center w-[150px]">دائن</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sampleEntries.map((entry) => (
                         <TableRow key={entry.id}>
                            <TableCell>{entry.date}</TableCell>
                            <TableCell>{entry.number}</TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell>{entry.account}</TableCell>
                            <TableCell className="text-center font-mono">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</TableCell>
                            <TableCell className="text-center font-mono">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
             </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
