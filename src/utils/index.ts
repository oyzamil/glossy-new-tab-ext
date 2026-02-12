import pkg from '@/../package.json';

export type PackageJson = typeof pkg;

export function readPackageJson(): PackageJson {
  return pkg; // ✔ Browser-safe
}

export function getPackageProp<K extends keyof PackageJson>(prop: K): PackageJson[K] {
  return pkg[prop];
}

export async function getBrowserName(): Promise<BrowserName> {
  // Firefox-only global (works in MV2 + MV3)
  if (typeof (globalThis as any).InstallTrigger !== 'undefined') {
    return 'firefox';
  }

  return 'chromium';
}
