$(document).ready(function() {
    var $top = $(".cd-top");
    var $navbar = $('.navbar');
    var offset = 300;
    var offset_opacity = 1200;

    //scroll back to top arrow, display & click
    $(window).scroll(function() {
      $(this).scrollTop() > offset
        ? $top.addClass("cd-is-visible")
        : $top.removeClass("cd-is-visible cd-fade-out");
      if ($(this).scrollTop() > offset_opacity) {
        $top.addClass("cd-fade-out");
      }

      // Shrink nav bar on scroll
      var scrollTop = $(window).scrollTop();
      if (scrollTop > offset) {
          $navbar.addClass('affix');
      } else {
          $navbar.removeClass('affix');
      }

      $graphics = $(document).find('.hideUntilAnimated').each(function() {
        var parent = $(this).closest('section').first().position().top - offset;
        $graphicTop = $(this).scrollTop();

        if(parent <= window.scrollY) {
          $(this).removeClass('hideUntilAnimated').addClass('isAnimated animate__animated animate__slideInUp');
        }
      });
    });

    // testimonial
    $('.testimonial-trigger').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('.testimonial-full').slideToggle();
    });

    $('.testimonial-full__close').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('.testimonial-full').slideUp();
    });

  });