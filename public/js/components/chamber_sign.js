AFRAME.registerComponent('chamber_sign', {
	dependencies: ['evil'],
	schema: {		
		id: {type: 'string'},		
		class: {type: 'string'},
		title: {type: 'string'},
		geometry: {type: 'string'},
		material: {type: 'color'},
		position: {type:'vec3'},
		rotation: {type:'vec3'},
		text: {type: 'string'},
		speed: {type:'number',default:500},
		autostart: {type:'boolean',default:false},
	},
	init: function () {		
		var data = this.data, el = this.el,evil=this.evil=document.querySelector('[evil]').components.evil;

		el.setAttribute("id",data.id);		
		if(data.class!='') el.setAttribute("class",data.class);
		if(data.position!='') el.setAttribute("position",data.position);
		if(data.rotation!='') el.setAttribute("rotation",data.rotation);
		
		this.handleSignanimationcomplete = AFRAME.utils.bind(this.handleSignanimationcomplete, this);
			
		var ti=evil.createEntity(el,{'id':data.id+'-title','geometry':"value:"+data.title+"; align:center; width: 1.6; height: auto; color: #fff;",'scale':'0 0 0','position':'0 0 0.01','class':data.class+'-titles'});
			evil.createAnimation("-ti-fadein",ti,"scale","fade-in","fade-stop","1 1 1",data.speed);
			evil.createAnimation("-ti-fadeout",ti,"scale","fade-out","fade-stop","0 0 0",data.speed);				
			ti.addEventListener('animationcomplete', this.handleSignanimationcomplete);
			this.titleEl=ti;
			//this.titleEl.object3D.frustumCulled = true;

		var ba=evil.createEntity(el,{'id':data.id+'-back','geometry':data.geometry,'scale':'0 0 0'});
		ba.setAttribute('material','color',data.material);
			evil.createAnimation("-ba-fadein",ba,"scale","fade-in","fade-stop","1 1 1",data.speed);
			evil.createAnimation("-ba-fadeout",ba,"scale","fade-out","fade-stop","0 0 0",data.speed);	
			ba.addEventListener('animationcomplete', this.handleSignanimationcomplete);
			this.backgroundEl=ba;
			if(data.autostart) ba.emit("fade-in",null,false);
	},
	update: function (oldData) {	
		var data=this.data,el=this.el,evil=this.evil,diff=AFRAME.utils.diff(oldData,data),changedKeys=Object.keys(diff);
			if(changedKeys[0]=="text"){
				this.titleEl.setAttribute('text','value',data.text);	
			}
	},
	handleSignanimationcomplete: function (event){
		var animID=event.detail.name;animID=animID.substring(11,animID.length);
		
		if(animID.startsWith("-ba")){
			if(animID.startsWith("-ba-fadein")){
				this.titleEl.emit("fade-in",null,false);
			}			
		}else if(animID.startsWith("-ti")){
			if(animID.startsWith("-ti-fadein")){
				if(numOfProjects>0){
					animCounter=0;evil.animateObjects(1,"project",numOfProjects,'A');
				}else{
					var catWall=chamber.querySelector("#chamber-cat-wall");
					if(catWall.getAttribute("scale").y<1){
						catWall.emit("fade-in",null,false);
					}else{
						catWall.emit("slide-in",null,false);
					}
				}				
			}			
		}
		event.stopPropagation();
	}
}); 