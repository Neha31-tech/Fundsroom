from flask import Blueprint, render_template
from flask_login import current_user

main_bp = Blueprint("main", __name__)


from app.models import Shopkeeper

@main_bp.route("/")
def home():
    shops = Shopkeeper.query.order_by(Shopkeeper.id.desc()).limit(8).all()
    return render_template("dundoo/index.html", shops=shops)

@main_bp.route("/dundoo-dashboard")
def dundoo_dashboard():
    return render_template("dundoo/dashboard.html")

