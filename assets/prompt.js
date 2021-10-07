function promptBox(title,description,label,confirmButton,cancelButton,callback){
	boxMode = true;
	document.getElementById('promptBox').innerHTML = `
	   <div class="backdrop-1wrmKB withLayer-RoELSG" style="opacity: 0.85; background: hsl(0, calc(var(--saturation-factor, 1) * 0%), 0%);"></div>
		   <div class="layer-2KE1M9">
			  <div class="focusLock-Ns3yie" role="dialog" aria-labelledby="uid_95" tabindex="-1" aria-modal="true">
				 <div class="root-1gCeng small-3iVZYw fullscreenOnMobile-1bD22y" style="opacity: 1; transform: scale(1);">
					<div class="flex-1xMQg5 flex-1O1GKY horizontal-1ae9ci horizontal-2EEEnY flex-1O1GKY directionRow-3v3tfG justifyStart-2NDFzi alignCenter-1dQNNs noWrap-3jynv6 header-1TKi98 header-3bB_GQ" id="uid_95" style="flex: 0 0 auto;">
					   <div class="colorHeaderPrimary-26Jzh- size24-RIRrxO title-2HFmAi">${title}</div>
					   <div class="colorHeaderSecondary-3Sp3Ft size16-1P40sf subtitle-8DQCLU">${description}</div>
					</div>
					<form onsubmit="event.preventDefault();document.getElementById('confirmButton').click()">
					   <div class="content-1LAB8Z content-2Cyhe6 thin-1ybCId scrollerBase-289Jih" dir="ltr" style="overflow: hidden scroll; padding-right: 8px;">
						  <div>
							 <h5 class="colorStandard-2KCXvj size14-e6ZScH h5-18_1nd title-3sZWYQ defaultMarginh5-2mL-bP">${label}</h5>
							 <div class="inputWrapper-31_8H8"><input class="inputDefault-_djjkz input-cIJ7To" type="" name="" placeholder="" maxlength="999" value="" id="promptInput"></div>
						  </div>
						  <div aria-hidden="true" style="position: absolute; pointer-events: none; min-height: 0px; min-width: 1px; flex: 0 0 auto; height: 16px;"></div>
					   </div>
					   <div class="flex-1xMQg5 flex-1O1GKY horizontalReverse-2eTKWD horizontalReverse-3tRjY7 flex-1O1GKY directionRowReverse-m8IjIq justifyStart-2NDFzi alignStretch-DpGPf3 noWrap-3jynv6 footer-2gL1pp" style="flex: 0 0 auto;">
						  <button type="button" id="confirmButton" style="width:auto">
							 <div class="contents-18-Yxp">${confirmButton}</div>
						  </button>
						  <button type="button" id="cancelButton" class="gray" style="width:auto;margin-right:15px">
							 <div class="contents-18-Yxp">${cancelButton}</div>
						  </button>
					   </div>
					</form>
				 </div>
			  </div>
	   </div>
	`
	document.getElementById('promptBox').style.display = "block";
	document.getElementById('promptInput').focus();
	document.getElementById('confirmButton').onclick = ()=>{
		callback(document.getElementById('promptInput').value);
		document.getElementById('confirmButton').onclick = null;
		document.getElementById('promptBox').style.display = 'none';
		boxMode = false;
	}
	
	document.getElementById('cancelButton').onclick = ()=>{
		document.getElementById('promptBox').style.display = 'none';
		boxMode = false;
	}
}