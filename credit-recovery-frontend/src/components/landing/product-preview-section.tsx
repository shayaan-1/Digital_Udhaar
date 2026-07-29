import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  LEDGER_ROWS,
  REMINDER_STATS,
  REPORT_LABELS,
  RISK_STYLES,
} from "@/components/landing/data"

export function ProductPreviewSection() {
  return (
    <section id="preview" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="mb-8 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#1F3D2E]">
        One ledger, every view an owner needs
      </h2>
      <Tabs defaultValue="ledger">
        <TabsList className="bg-[#1F3D2E]/5">
          <TabsTrigger value="ledger">Customer ledger</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger">
          <Card className="border-[#1F3D2E]/10">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Avg. delay</TableHead>
                    <TableHead>Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LEDGER_ROWS.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-[#1B1B18]/60">{row.city}</TableCell>
                      <TableCell className="font-[family-name:var(--font-mono)]">
                        Rs. {row.outstanding}
                      </TableCell>
                      <TableCell className="text-[#1B1B18]/60">{row.delay}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={RISK_STYLES[row.risk]}>
                          {row.risk}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders">
          <Card className="border-[#1F3D2E]/10">
            <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
              {REMINDER_STATS.map((stat) => (
                <div key={stat.label} className="rounded-lg bg-[#1F3D2E]/[0.04] p-4">
                  <p className="font-[family-name:var(--font-mono)] text-2xl font-semibold text-[#1F3D2E]">
                    {stat.value}
                  </p>
                  <p className="text-sm text-[#1B1B18]/60">{stat.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="border-[#1F3D2E]/10">
            <CardContent className="flex flex-wrap gap-3 pt-6">
              {REPORT_LABELS.map((r) => (
                <Badge
                  key={r}
                  variant="outline"
                  className="border-[#1F3D2E]/20 px-3 py-1 text-[#1F3D2E]"
                >
                  {r}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  )
}
