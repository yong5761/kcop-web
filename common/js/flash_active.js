function flashwrite( id, flashUri, vWidth, vHeight, winMode ) {
	var _obj_ = "";
	_obj_ = '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=7,0,0,0" width="' + vWidth + '" height="' + vHeight + '" id="' + id + '" align="middle">';
	_obj_ += '<param name="movie" value="' + flashUri + '" />';
	_obj_ += '<param name="allowScriptAccess" value="always" />';
	_obj_ += '<param name="quality" value="high" />';
	_obj_ += '<param name="wmode" value="' + winMode + '" />    ';
	_obj_ += '<param name="bgcolor" value="#ffffff" />        ';
	
	_obj_ += '<embed src="' + flashUri + '" quality="high"  allowScriptAccess="always" wmode="' + winMode + '" bgcolor="#ffffff" width="' + vWidth +'" height="' + vHeight + '" id="' + id + '" align="middle" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" /></embed>    ';
	_obj_ += '</object>';

	
	
	document.writeln( _obj_ );

}

