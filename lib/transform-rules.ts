export type TransformRule = {
  pattern: RegExp
  transform: (match: string) => string
}
