"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children, ...props }) => (
          <h1 {...props} className="text-lg font-bold text-foreground mt-4 mb-2 pb-1 border-b border-border first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 {...props} className="text-base font-semibold text-foreground mt-3 mb-2">
            {children}
          </h2>
        ),
        h3: ({ children, ...props }) => (
          <h3 {...props} className="text-sm font-medium text-foreground mt-3 mb-1">
            {children}
          </h3>
        ),
        p: ({ children, ...props }) => (
          <p {...props} className="text-muted-foreground leading-relaxed my-2 text-sm">
            {children}
          </p>
        ),
        code: ({ children, className, ...props }) => {
          const isInline = !className
          if (isInline) {
            return (
              <code {...props} className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">
                {children}
              </code>
            )
          }
          return <code {...props} className="font-mono" />
        },
        pre: ({ children, ...props }) => (
          <div className="my-3 overflow-x-auto rounded-lg border bg-muted p-3 text-sm leading-relaxed">
            <pre {...props} className="m-0 bg-transparent p-0">
              {children}
            </pre>
          </div>
        ),
        ul: ({ children, ...props }) => (
          <ul {...props} className="list-disc list-inside space-y-1 my-2 ml-2 text-muted-foreground text-sm">
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol {...props} className="list-decimal list-inside space-y-1 my-2 ml-2 text-muted-foreground text-sm">
            {children}
          </ol>
        ),
        li: ({ children, ...props }) => (
          <li {...props} className="leading-relaxed">{children}</li>
        ),
        blockquote: ({ children, ...props }) => (
          <blockquote {...props} className="border-l-4 border-primary/50 pl-4 my-2 italic text-muted-foreground text-sm">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-border my-4" />,
        table: ({ children, ...props }) => (
          <div className="overflow-x-auto my-3">
            <table {...props} className="w-full text-sm border-collapse">
              {children}
            </table>
          </div>
        ),
        th: ({ children, ...props }) => (
          <th {...props} className="border px-3 py-2 text-left font-semibold text-foreground bg-muted">
            {children}
          </th>
        ),
        td: ({ children, ...props }) => (
          <td {...props} className="border px-3 py-2 text-muted-foreground">
            {children}
          </td>
        ),
        strong: ({ children, ...props }) => (
          <strong {...props} className="font-semibold text-foreground">
            {children}
          </strong>
        ),
        a: ({ children, href, ...props }) => (
          <a {...props} href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline underline-offset-2">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
