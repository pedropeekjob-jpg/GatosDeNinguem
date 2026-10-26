import cv2, numpy as np, json
from PIL import Image
from tr import trace
S=1193/2946; K=2; PAD=40
def T(x,y): return x/K-PAD*S+20, y/K-PAD*S+21
blk=np.load('blk.npy'); lab=np.load('lab.npy'); hl=np.load('hl.npy'); leg=np.load('leg.npy')
cat=lab==1
filled=cat|(hl>0)
out={}
# Solid silhouette: the cat with its tail ring, details filled in, but the inner ear kept open (it moves with the ear).
out['LOGO_SILHOUETTE']=trace((filled&~(hl==1))|(leg>0),T)
out['LOGO_EYE']=trace((hl==2)|(lab==2),T)
out['LOGO_EYE_LID']=trace(lab==2,T)
out['LOGO_WINK']=trace(hl==3,T)
out['LOGO_MOUTH']=trace(hl==4,T)
out['LOGO_PAWS']=trace(hl==5,T)
out['LOGO_LEG']=trace(leg>0,T)
out['LOGO_O']=trace(lab==3,T)
out['LOGO_LETTERS']=trace((lab>3),T)
out['STATIC']=trace(blk>0,T)
out['CAT']=trace(cat|(lab==2),T)
json.dump(out,open('parts.json','w'))
# where the O sits
ys,xs=np.where(lab==3); print('O bbox', T(xs.min(),ys.min()), T(xs.max()+1,ys.max()+1))
print({k:len(v) for k,v in out.items()})
