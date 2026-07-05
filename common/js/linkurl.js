function linkurl(j,k){
	var link_page = new Array();

//
	link_page[0] = new Array(0);
	link_page[0][1] = "/index.asp";//본원
	link_page[0][2] = "/kr/";//국문
	link_page[0][3] = "/cn/";//중문
	link_page[0][4] = "/usa/","_blank";//USA
	link_page[0][5] = "/germany/","_blank";//독일
	link_page[0][6] = "/italy/","_blank";//이태리
	link_page[0][7] = "/france/","_blank";//프랑스
	link_page[0][7] = "/japan/","_blank";//일본


//
	link_page[1] = new Array();
	link_page[1][0] = "/common/shop/shop01.asp"; 
	link_page[1][1] = "/common/shop/shop02.asp"; 
	link_page[1][2] = "/common/shop/shop03.asp"; 
	link_page[1][3] = "/common/shop/shop04.asp"; 
	link_page[1][4] = "/common/shop/shop05.asp"; 
	link_page[1][5] = "/common/shop/shop06.asp"; 
	link_page[1][6] = "/common/shop/shop07.asp"; 


//
	link_page[2] = new Array();
	link_page[2][0] = "/common/brand/brand01.asp";  
	link_page[2][1] = "/common/brand/brand02.asp";  
	link_page[2][2] = "/common/brand/brand03.asp";  
	link_page[2][3] = "/common/brand/brand04.asp";  
	link_page[2][4] = "/common/brand/brand05.asp";  
	link_page[2][5] = "/common/brand/brand06.asp";  

//
	link_page[3] = new Array();
	link_page[3][0] = "/common/media/media01.asp"; 
	link_page[3][1] = "/common/media/media02.asp"; 
	link_page[3][2] = "/common/media/media03.asp"; 
	link_page[3][3] = "/common/media/media04.asp"; 


//
	link_page[4] = new Array();
	link_page[4][0] = "/common/event/event01.asp"; 
	link_page[4][1] = "/common/event/event02.asp"; 
	link_page[4][2] = "/common/event/event03.asp"; 
	link_page[4][3] = "/common/event/event04.asp"; 
	link_page[4][4] = "/common/event/event05.asp"; 



//
	link_page[5] = new Array();
	link_page[5][0] = "/common/community/community01.asp";
	link_page[5][1] = "/common/community/community02.asp";
	link_page[5][2] = "/common/community/community03.asp";
	link_page[5][3] = "/common/community/community04.asp";
	link_page[5][4] = "/common/community/community05.asp";
	link_page[5][5] = "/common/community/community06.asp";
	link_page[5][6] = "/common/community/community07.asp";
	link_page[5][7] = "/common/community/community08.asp";




//멤버쉽
	link_page[6] = new Array();
	link_page[6][0] = "/common/member/login.asp";
	link_page[6][1] = "/common/member/join.asp";
	link_page[6][2] = "/common/member/search.asp";
	link_page[6][3] = "/common/member/info01.asp";
	link_page[6][4] = "/common/member/info02.asp";

	
//마이페이지
	link_page[7] = new Array();
	link_page[7][0] = "/common/mypage/orderlist.asp";
	link_page[7][1] = "/common/mypage/wishlist.asp";
	link_page[7][2] = "/common/mypage/point.asp";
	link_page[7][3] = "/common/mypage/qnalist.asp";
	link_page[7][4] = "/common/mypage/modify.asp";


//주문
	link_page[8] = new Array();
	link_page[8][0] = "/common/cart/cart.asp";
	link_page[8][1] = "/common/cart/order.asp";
	link_page[8][2] = "/common/cart/complete.asp";


//
	link_page[9] = new Array();
	link_page[9][0] = "/common/all/alllist.asp";
	link_page[9][1] = "/common/other/sitemap.asp";
	link_page[9][2] = "/common/other/.asp";




	location.href=link_page[j][k];
}
