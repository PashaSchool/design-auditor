export type Severity = 'pass' | 'warn' | 'error'

export interface Violation {
  id: string
  severity: Severity
  message: string
  hint?: string
}

export interface ModuleReport {
  name: string
  violations: Violation[]
}
