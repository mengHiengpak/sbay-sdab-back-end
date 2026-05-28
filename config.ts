let ytDlpPath: string | undefined;

export function setYtDlpPath(path: string | undefined): void {
  ytDlpPath = path;
}

export function getYtDlpPath(): string | undefined {
  return ytDlpPath;
}
