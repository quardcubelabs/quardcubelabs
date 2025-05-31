import Navbar from "@/components/navbar"

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="print:hidden">
        <Navbar />
      </div>
      {children}
    </>
  )
} 