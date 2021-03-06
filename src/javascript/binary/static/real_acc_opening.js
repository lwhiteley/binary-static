pjax_config_page("new_account/realws", function(){

  return {
    onLoad: function() {
      Content.populate();
      var residenceValue = $.cookie('residence');
      if (!$.cookie('login') || !residenceValue) {
          window.location.href = page.url.url_for('login');
          return;
      }
      if (page.client.type !== 'virtual') {
        window.location.href = page.url.url_for('user/myaccount');
        return;
      }
      for (i = 0; i < page.user.loginid_array.length; i++){
        if (page.user.loginid_array[i].real === true){
          window.location.href = page.url.url_for('user/myaccount');
          return;
        }
      }
      if (page.client.is_logged_in) {
          client_form.set_virtual_email_id(page.client.email);
      }
      RealAccOpeningUI.setValues(residenceValue);

      $('#real-form').submit(function(evt) {
        evt.preventDefault();
        if (RealAccOpeningUI.checkValidity()){
          BinarySocket.init({
            onmessage: function(msg){
              var response = JSON.parse(msg.data);
              if (response) {
                var type = response.msg_type;
                var error = response.error;

                if (type === 'new_account_real' && !error){
                  var loginid = response.new_account_real.client_id;

                  //set cookies
                  var oldCookieValue = $.cookie('loginid_list');
                  $.cookie('loginid_list', loginid + ':R:E+' + oldCookieValue, {domain: document.domain.substring(3), path:'/'});
                  $.cookie('loginid', loginid, {domain: document.domain.substring(3), path:'/'});

                  //push to gtm
                  var gtmDataLayer = document.getElementsByClassName('gtm_data_layer')[0];
                  var age = new Date().getFullYear() - document.getElementById('dobyy').value;
                  document.getElementById('event').innerHTML = 'new_account';
                  dataLayer.push({
                    'language': page.language(),
                    'event': 'new_account',
                    'visitorID': loginid,
                    'bom_age': age,
                    'bom_country': $('#residence-disabled option[value="' + residenceValue + '"]').html(),
                    'bom_date_joined': Math.floor(Date.now() / 1000),
                    'bom_email': page.user.email,
                    'bom_firstname': document.getElementById('fname').value,
                    'bom_lastname': document.getElementById('lname').value,
                    'bom_phone': document.getElementById('tel').value
                  });
                  var affiliateToken = $.cookie('affiliate_tracking');
                  if (affiliateToken) {
                    dataLayer.push({'bom_affiliate_token': affiliateToken});
                  }

                  //generate dropdown list and switch
                  var option = new Option('Real Account (' + loginid + ')', loginid);
                  document.getElementById('client_loginid').appendChild(option);
                  $('#client_loginid option[value="' + page.client.loginid + '"]').removeAttr('selected');
                  option.setAttribute('selected', 'selected');
                  $('#loginid-switch-form').submit();
                } else if (error) {
                  if (/multiple real money accounts/.test(error.message)){
                    RealAccOpeningUI.showError('duplicate');
                  } else {
                    RealAccOpeningUI.showError();
                  }
                }
              }
            }
          });
        }
      });
    }
  };
});
