import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";

const meta: Meta<typeof Table> = {
  title: "UI Base/Table",
  component: Table,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Table>;

const invoices = [
  { invoice: "INV-001", status: "Paid", method: "Credit Card", amount: "$250.00" },
  { invoice: "INV-002", status: "Pending", method: "PayPal", amount: "$150.00" },
  { invoice: "INV-003", status: "Unpaid", method: "Bank Transfer", amount: "$350.00" },
  { invoice: "INV-004", status: "Paid", method: "Credit Card", amount: "$450.00" },
  { invoice: "INV-005", status: "Paid", method: "PayPal", amount: "$550.00" },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$1,750.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};
