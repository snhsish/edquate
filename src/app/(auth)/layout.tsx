import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="!flex !min-h-svh !h-svh !w-full flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-2.5">
        <Image
          src="/icons/edquate.png"
          alt="Edquate"
          width={40}
          height={40}
          className="rounded-lg dark:hidden"
        />
        <Image
          src="/icons/edquate.png"
          alt="Edquate"
          width={40}
          height={40}
          className="rounded-lg hidden dark:block"
        />
        <span className="text-xl font-bold tracking-tight">Edquate</span>
      </div>
      {children}
    </div>
  )
}
