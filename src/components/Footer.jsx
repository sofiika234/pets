import React from 'react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer bg-dark text-white mt-auto">
      <div className="container py-4">
        <div className="row align-items-center">
          {/* Логотип и описание */}
          <div className="col-lg-6 col-md-8 mb-3 mb-md-0">
            <div className="d-flex align-items-center">
              <div className="logo bg-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                   style={{ width: '40px', height: '40px' }}>
                <span className="text-primary fs-4">🐾</span>
              </div>
              <div>
                <h5 className="mb-1 text-white">Найди друга</h5>
                <p className="mb-0 text-light-50 small">
                  Помогаем животным обрести любящий дом
                </p>
              </div>
            </div>
          </div>
          
          {/* Контакты */}
          <div className="col-lg-6 col-md-4">
            <div className="footer-contact text-md-end">
              <div className="d-inline-block text-start">
                <div className="mb-1">
                  <i className="bi bi-envelope me-2"></i>
                  <a href="mailto:info@naididruga.ru" className="text-white text-decoration-none small">
                    info@naididruga.ru
                  </a>
                </div>
                <div>
                  <i className="bi bi-telephone me-2"></i>
                  <a href="tel:+79991234567" className="text-white text-decoration-none small">
                    +7 (999) 123-45-67
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Нижняя часть */}
        <div className="footer-bottom pt-3 mt-3 border-top border-secondary">
          <div className="row align-items-center">
            <div className="col-md-6 mb-2 mb-md-0">
              <p className="mb-0 text-light-50 small">
                &copy; {currentYear} Найди друга. Все права защищены.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-0 text-light-50 small">
                Сервис поиска домашних животных
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;