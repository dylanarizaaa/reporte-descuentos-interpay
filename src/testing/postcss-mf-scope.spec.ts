import postcss from 'postcss';

// Plugin del build (CommonJS en `tools/`), configurado en `.postcssrc.json`. Jest corre en Node.
declare const require: (id: string) => unknown;
const mfScope = require('../../tools/postcss-mf-scope.cjs') as (options: {
  scope: string;
  files: string[];
}) => postcss.Plugin;

const run = (css: string, from = '/proyecto/src/styles.css') =>
  postcss([mfScope({ scope: '.mf-reportes', files: ['src/styles.css'] })]).process(css, { from })
    .css;

describe('postcss-mf-scope', () => {
  it('convierte la raíz del documento en el ámbito', () => {
    expect(run(':root { --primary: blue; }')).toBe('.mf-reportes { --primary: blue; }');
    expect(run(':root.dark { --primary: black; }')).toBe('.mf-reportes.dark { --primary: black; }');
    expect(run('html, :host { line-height: 1.5; }')).toBe(
      '.mf-reportes, .mf-reportes { line-height: 1.5; }',
    );
  });

  it('los estilos de body no aplican al contenedor de overlays', () => {
    expect(run('body { background: white; }')).toBe(
      '.mf-reportes:not(.cdk-overlay-container) { background: white; }',
    );
  });

  it('encierra el resto de selectores dentro del ámbito', () => {
    expect(run('.flex { display: flex; }')).toBe('.mf-reportes .flex { display: flex; }');
    expect(run('*, ::before { box-sizing: border-box; }')).toBe(
      '.mf-reportes *, .mf-reportes ::before { box-sizing: border-box; }',
    );
    expect(run('@media (width >= 48rem) { .md\\:flex { display: flex; } }')).toBe(
      '@media (width >= 48rem) { .mf-reportes .md\\:flex { display: flex; } }',
    );
    // `&` escapado dentro del nombre de una clase arbitraria: también va al ámbito.
    expect(run('.\\[\\&_th\\]\\:p-0 th { padding: 0; }')).toBe(
      '.mf-reportes .\\[\\&_th\\]\\:p-0 th { padding: 0; }',
    );
  });

  it('deja globales las reglas estructurales de CDK, las anidadas y los pasos de animación', () => {
    expect(run('.cdk-overlay-container { position: fixed; }')).toBe(
      '.cdk-overlay-container { position: fixed; }',
    );
    expect(run('.btn { &:hover { color: red; } }')).toBe(
      '.mf-reportes .btn { &:hover { color: red; } }',
    );
    expect(run('.a { color: red; .b { color: blue; } }')).toBe(
      '.mf-reportes .a { color: red; .b { color: blue; } }',
    );
    expect(run('@keyframes giro { from { opacity: 0; } to { opacity: 1; } }')).toBe(
      '@keyframes giro { from { opacity: 0; } to { opacity: 1; } }',
    );
  });

  it('solo transforma la hoja global, no los estilos de componentes', () => {
    expect(run('.flex { display: flex; }', '/proyecto/src/app/componente.css')).toBe(
      '.flex { display: flex; }',
    );
    expect(run('.flex { display: flex; }', 'C:\\proyecto\\src\\styles.css')).toBe(
      '.mf-reportes .flex { display: flex; }',
    );
  });

  it('exige el ámbito y los archivos', () => {
    expect(() => mfScope({ scope: '', files: [] })).toThrow('postcss-mf-scope');
  });
});
