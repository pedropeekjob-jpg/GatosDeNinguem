import json
R='../../..'
p=json.load(open('parts.json')); h=json.load(open('horiz.json'))
INK='#221e20'
def svg(vb,d,fill,title='Gatos de Ninguém'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img"><title>{title}</title><path fill="{fill}" d="{d}"/></svg>\n'
files={
 'logo.svg':svg('0 0 1185 1234',p['STATIC'],INK),
 'logo-branco.svg':svg('0 0 1185 1234',p['STATIC'],'#ffffff'),
 'logo-horizontal.svg':svg(h['vb'],h['d'],INK),
 'logo-horizontal-branco.svg':svg(h['vb'],h['d'],'#ffffff'),
 'icon.svg':svg('-15 11 1215 1215',p['CAT'],INK),
}
for app in ('web','backoffice'):
    for n,c in files.items(): open(f'{R}/apps/{app}/public/{n}','w').write(c)
names=['LOGO_SILHOUETTE','LOGO_EYE','LOGO_EYE_LID','LOGO_WINK','LOGO_MOUTH','LOGO_PAWS','LOGO_LEG','LOGO_O','LOGO_LETTERS']
docs={'LOGO_SILHOUETTE':"The cat's outline with its tail ring, filled solid (only the inside of the left ear stays open).",
'LOGO_EYE':'The open eye: a light circle with a dark lid inside.','LOGO_EYE_LID':None,'LOGO_WINK':'The winking eye.',
'LOGO_MOUTH':'Nose, mouth and cheeks.','LOGO_PAWS':'The front paws folded on the chest.','LOGO_LEG':'The back leg line.',
'LOGO_O':'The "O" of "Gatos": the ball turns into it.','LOGO_LETTERS':'Every other letter of "Gatos de Ninguém".'}
out=['// Traced from the association’s artwork (docs/logo-origem, LogotipoGatosNinguem-02.png), in viewBox units (0 0 1185 1234).',
'// Split into parts so the cat can be animated piece by piece: the solid silhouette, and the light details',
'// (eyes, mouth, paws, leg) that sit on top of it in the background colour.','','export const LOGO_VIEWBOX = "0 0 1185 1234";']
for n in names:
    if docs[n]: out.append(f'/** {docs[n]} */')
    out.append(f'export const {n} = "{p[n]}";')
open(f'{R}/packages/ui/src/components/logoPaths.ts','w').write('\n'.join(out)+'\n')
