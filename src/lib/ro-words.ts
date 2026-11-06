/** „5 persoane”, dar „24 de persoane”: în română, de la 20 în sus numărul cere „de”. */
export const cereDe = (n: number) => n % 100 >= 20 || (n >= 100 && n % 100 === 0);
export const de = (n: number) => (cereDe(n) ? `${n} de` : `${n}`);
export const persoane = (n: number) => (n === 1 ? "o persoană" : `${de(n)} persoane`);
export const locuri = (n: number) => (n === 1 ? "un loc" : `${de(n)} locuri`);
export const amintiri = (n: number) => (n === 1 ? "o amintire" : `${de(n)} amintiri`);
export const oameni = (n: number) => (n === 1 ? "un om" : `${de(n)} oameni`);
export const zile = (n: number) => (n === 1 ? "o zi" : `${de(n)} zile`);
export const inZile = (n: number) => (n === 1 ? "într-o zi" : `în ${de(n)} zile`);
