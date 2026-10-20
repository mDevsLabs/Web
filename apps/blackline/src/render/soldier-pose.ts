import * as T from 'three';
import type { SoldierVisual } from './soldiers.ts';
const down=new T.Vector3(0,-1,0),direction=new T.Vector3(),bend=new T.Vector3(),elbow=new T.Vector3(),lowerDirection=new T.Vector3(),target=new T.Vector3(),inverse=new T.Quaternion();
const forearms=new WeakMap<T.Group,T.Object3D>();
function armPose(arm:T.Group,side:number,x:number,y:number,z:number,matrix:T.Matrix4){
  let forearm=forearms.get(arm);if(!forearm){forearm=arm.getObjectByName('forearm');if(!forearm)return;forearms.set(arm,forearm);}target.set(x,y,z).applyMatrix4(matrix);
  const upper=.32,lower=.36;direction.copy(target).sub(arm.position);const length=Math.max(.05,Math.min(upper+lower-.002,direction.length()));direction.normalize();
  bend.set(side,-.45,.18).addScaledVector(direction,-bend.dot(direction)).normalize();const along=(upper*upper-lower*lower+length*length)/(2*length),height=Math.sqrt(Math.max(0,upper*upper-along*along));
  elbow.copy(arm.position).addScaledVector(direction,along).addScaledVector(bend,height);
  arm.quaternion.setFromUnitVectors(down,direction.copy(elbow).sub(arm.position).normalize());inverse.copy(arm.quaternion).invert();lowerDirection.copy(target).sub(elbow).normalize().applyQuaternion(inverse);forearm.quaternion.setFromUnitVectors(down,lowerDirection);
}
// Pooled math temporaries avoid allocations for every actor on every rendered frame.
export function aimSoldierArms(v:SoldierVisual){v.weapon.updateMatrix();const pistol=v.weapon.userData.weaponId==='pistol';armPose(v.leftArm,-1,pistol?-.035:0,-.12,pistol?.02:-.20,v.weapon.matrix);armPose(v.rightArm,1,0,-.18,.085,v.weapon.matrix);}
