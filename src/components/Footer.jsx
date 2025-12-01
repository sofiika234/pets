import React from 'react';

function Footer() {
  return (
    <footer className="footer mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="footer-logo">
              <div className="logo">
                <span className="logo-icon">🐾</span>
              </div>
              <h4 className="mb-0">Найди друга</h4>
            </div>
            <p className="footer-description">
              Помогаем животным найти любящий дом. Присоединяйтесь к нашему сообществу волонтеров.
            </p>
          </div>
          
          <div className="col-lg-3 col-md-6 mb-4">
            <h5>Контакты</h5>
            <div className="footer-contact">
              <p>📧 info@naididruga.ru</p>
              <p>📞 +7 (999) 123-45-67</p>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Найди друга. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;