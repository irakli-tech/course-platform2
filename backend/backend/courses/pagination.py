from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """
    სტანდარტული pagination მთელი API-სთვის.
    - ნაგულისხმევი page size: 6 (გვერდზე 6 კურსი/ჩანაწერი).
    - კლიენტს შეუძლია მოთხოვნა გვერდის ზომაზე ?page_size=N პარამეტრით
      (მაგ. სტუდენტის სრული კურსების ისტორიის ერთბაშად წამოსაღებად).
    - max_page_size იცავს API-ს ზედმეტად დიდი მოთხოვნებისგან.
    """
    page_size = 6
    page_size_query_param = 'page_size'
    max_page_size = 50
