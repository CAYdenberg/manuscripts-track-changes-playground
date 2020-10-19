export default class {
  public commit: number | null
  public from: number
  public to: number

  constructor(from: number, to: number, commit: number | null) {
    this.from = from
    this.to = to
    this.commit = commit
  }
}
