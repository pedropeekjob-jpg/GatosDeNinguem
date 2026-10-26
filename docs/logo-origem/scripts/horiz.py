import numpy as np, json
from PIL import Image
from tr import trace
U='../LogotipoGatosNinguem-01.png'
im=Image.open(U).convert('RGBA'); x0,y0,x1,y1=86,226,3388,1612
S=0.36; K=2  # output units = source px * S; trace at 2x that
pad=20
im=im.crop((x0-pad,y0-pad,x1+pad,y1+pad)); W,H=round(im.width*S*K),round(im.height*S*K)
a=np.array(im.resize((W,H),Image.LANCZOS)); blk=(a[...,3]>127)&(a[...,:3].mean(2)<128)
d=trace(blk,lambda x,y:(x/K-pad*S, y/K-pad*S))
vb=f"0 0 {round((x1-x0)*S)} {round((y1-y0)*S)}"
json.dump({'d':d,'vb':vb},open('horiz.json','w')); print(vb,len(d))
