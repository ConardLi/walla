"use client";

import { isValidElement, Children } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { memo } from "react";
import { CodeBlock } from "./code-block";

interface MarkdownRendererProps {
  content: string;
}

function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children))
    return children.map(extractTextFromChildren).join("");
  if (isValidElement(children)) {
    const props = children.props as Record<string, unknown>;
    if (props.children) {
      return extractTextFromChildren(props.children as React.ReactNode);
    }
  }
  return String(children ?? "");
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
}: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // 行内代码
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match && !className;

          if (isInline) {
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-muted text-[13px] font-mono"
                {...props}
              >
                {children}
              </code>
            );
          }

          // 代码块由 pre 组件处理，这里直接返回
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        // 代码块容器 → 使用 CodeBlock 组件（带语法高亮 + 复制按钮）
        pre({ children }) {
          // react-markdown 的 pre 内部是一个 code 元素（可能是原生或自定义组件）
          const childArray = Children.toArray(children);
          const child = childArray.length === 1 ? childArray[0] : null;
          if (child && isValidElement(child)) {
            const props = child.props as Record<string, unknown>;
            const className = String(props.className ?? "");
            const match = /language-(\w+)/.exec(className);
            const lang = match ? match[1] : undefined;
            const code = extractTextFromChildren(
              props.children as React.ReactNode,
            ).replace(/\n$/, "");
            if (code) {
              return <CodeBlock code={code} language={lang} />;
            }
          }
          return (
            <pre className="rounded-lg border bg-muted/50 p-4 overflow-x-auto text-[13px] my-3">
              {children}
            </pre>
          );
        },
        // 链接
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          );
        },
        // 表格
        table({ children }) {
          return (
            <div className="overflow-x-auto my-3 rounded-lg border">
              <table className="w-full text-sm">{children}</table>
            </div>
          );
        },
        th({ children }) {
          return (
            <th className="border-b bg-muted/50 px-3 py-2 text-left font-medium">
              {children}
            </th>
          );
        },
        td({ children }) {
          return <td className="border-b px-3 py-2">{children}</td>;
        },
        // 水平线
        hr() {
          return <hr className="my-4 border-border/50" />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
});
