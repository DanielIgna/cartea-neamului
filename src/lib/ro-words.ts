/** „5 persoane”, dar „24 de persoane”: în română, de la 20 în sus numărul cere „de”. */
export const de = (n: number) => (n % 100 >= 20 || (n >= 100 && n % 100 === 0) ? `${n} de` : `${n}`);
export const persoane = (n: number) => (n === 1 ? "o persoană" : `${de(n)} persoane`);
export const locuri = (n: number) => (n === 1 ? "un loc" : `${de(n)} locuri`);
