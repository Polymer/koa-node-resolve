export const preserveOriginalWhitespaceBuffer =
    (original: string, target: string): string => original.match(/^\s*/)![0] +
    target.replace(/^\s*|\s*$/, '') + original.match(/\s*$/)![0];
