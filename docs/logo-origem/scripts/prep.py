import cv2, numpy as np
from PIL import Image
U='../LogotipoGatosNinguem-02.png'
S=1193/2946; K=2  # work at 2x the target scale
im=Image.open(U).convert('RGBA').crop((517-40,155-40,517+2757+40,155+2946+40))
W,H=round(im.width*S*K),round(im.height*S*K)
im=im.resize((W,H),Image.LANCZOS)
a=np.array(im); blk=((a[...,3]>127)&(a[...,:3].mean(2)<128)).astype(np.uint8)
np.save('blk.npy',blk)
# work px -> target units: x_t = (x/K) - 40*S + 20
def T(x,y): return x/K-40*S+20, y/K-40*S+21
n,lab,st,cen=cv2.connectedComponentsWithStats(blk,8)
cat=1+np.argmax(st[1:,4]); np.save('lab.npy',lab)
catm=(lab==cat).astype(np.uint8)
ff=catm.copy(); mask=np.zeros((H+2,W+2),np.uint8); cv2.floodFill(ff,mask,(0,0),2)
filled=(ff!=2).astype(np.uint8)
holes=filled&(1-catm)
hn,hl,hs,hc=cv2.connectedComponentsWithStats(holes,8)
np.save('hl.npy',hl)
print('cat',cat)
for i in range(1,hn):
  x,y,w,h,ar=hs[i]; print('hole',i,'at',[round(v) for v in T(x,y)],'size',round(w/K),round(h/K),'area',ar)
for i in range(1,n):
  if i==cat: continue
  x,y,w,h,ar=st[i]; print('comp',i,'at',[round(v) for v in T(x,y)],'size',round(w/K),round(h/K),'area',ar, 'inside' if filled[int(cen[i][1]),int(cen[i][0])] else '')

# The back-leg line is open to the edge: close it (so the silhouette is solid) and keep it as its own detail.
filled=filled.astype(np.uint8)
ker=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(31,31))
d=cv2.morphologyEx(filled,cv2.MORPH_CLOSE,ker)&(1-filled)
ln,ll,ls,_=cv2.connectedComponentsWithStats(d,8)
np.save('leg.npy',(ll==max(range(1,ln),key=lambda i:ls[i][4])).astype(np.uint8))
