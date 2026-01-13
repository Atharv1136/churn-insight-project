"""
Health Check Script - Verify Backend Setup
"""
import os
import sys
from pathlib import Path

def check_models():
    """Check if models are trained"""
    models_dir = Path("models/saved_models")
    required_models = ["xgboost.pkl", "random_forest.pkl", "logistic_regression.pkl"]
    
    print("\n🔍 Checking Models...")
    print("-" * 50)
    
    if not models_dir.exists():
        print("❌ Models directory not found!")
        return False
    
    all_exist = True
    for model in required_models:
        model_path = models_dir / model
        if model_path.exists():
            size_mb = model_path.stat().st_size / (1024 * 1024)
            print(f"✅ {model} ({size_mb:.2f} MB)")
        else:
            print(f"❌ {model} - NOT FOUND")
            all_exist = False
    
    return all_exist

def check_scaler():
    """Check if scaler exists"""
    scaler_path = Path("models/scalers/scaler.pkl")
    
    print("\n🔍 Checking Scaler...")
    print("-" * 50)
    
    if scaler_path.exists():
        size_kb = scaler_path.stat().st_size / 1024
        print(f"✅ scaler.pkl ({size_kb:.2f} KB)")
        return True
    else:
        print("❌ scaler.pkl - NOT FOUND")
        return False

def check_database():
    """Check if database exists"""
    db_path = Path("database/churn.db")
    
    print("\n🔍 Checking Database...")
    print("-" * 50)
    
    if db_path.exists():
        size_kb = db_path.stat().st_size / 1024
        print(f"✅ churn.db ({size_kb:.2f} KB)")
        return True
    else:
        print("⚠️  churn.db - NOT FOUND (will be created automatically)")
        return True  # Database is created automatically

def check_dependencies():
    """Check if required packages are installed"""
    print("\n🔍 Checking Dependencies...")
    print("-" * 50)
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "pandas",
        "numpy",
        "scikit-learn",
        "xgboost",
        "shap",
        "joblib"
    ]
    
    all_installed = True
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - NOT INSTALLED")
            all_installed = False
    
    return all_installed

def check_data():
    """Check if data files exist"""
    data_dir = Path("data/raw")
    
    print("\n🔍 Checking Data Files...")
    print("-" * 50)
    
    if not data_dir.exists():
        print("⚠️  data/raw directory not found")
        return False
    
    csv_files = list(data_dir.glob("*.csv"))
    if csv_files:
        for csv_file in csv_files:
            size_kb = csv_file.stat().st_size / 1024
            print(f"✅ {csv_file.name} ({size_kb:.2f} KB)")
        return True
    else:
        print("⚠️  No CSV files found (sample data will be generated)")
        return True  # Sample data can be generated

def main():
    print("=" * 50)
    print("🏥 BACKEND HEALTH CHECK")
    print("=" * 50)
    
    # Change to backend directory if not already there
    if Path("backend").exists() and not Path("app").exists():
        os.chdir("backend")
        print("📁 Changed to backend directory")
    
    results = {
        "Dependencies": check_dependencies(),
        "Data Files": check_data(),
        "Models": check_models(),
        "Scaler": check_scaler(),
        "Database": check_database()
    }
    
    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    
    all_good = True
    for check, status in results.items():
        status_icon = "✅" if status else "❌"
        print(f"{status_icon} {check}")
        if not status:
            all_good = False
    
    print("\n" + "=" * 50)
    
    if all_good:
        print("✅ All checks passed! Backend is ready.")
        print("\n🚀 Start the server with:")
        print("   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    else:
        print("⚠️  Some checks failed!")
        print("\n📝 Next steps:")
        
        if not results["Dependencies"]:
            print("   1. Install dependencies: pip install -r requirements.txt")
        
        if not results["Models"] or not results["Scaler"]:
            print("   2. Train models: python train_models.py")
        
        print("\n📖 For more help, see TROUBLESHOOTING.md")
    
    print("=" * 50)
    
    return 0 if all_good else 1

if __name__ == "__main__":
    sys.exit(main())
