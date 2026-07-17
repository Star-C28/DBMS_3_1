-- Section A

-- 1. Product Catalog
SELECT ProductName, Unit, Price
FROM Product;

-- 2. Beverage Identification
SELECT CategoryID, CategoryName
FROM Category
WHERE Description LIKE '%Soft drinks%';

-- 3. Cheap Products
SELECT ProductName
FROM Product
WHERE Price < 15.00;

-- 4. Sales Representative Roster
SELECT FirstName, LastName, City
FROM Employee
WHERE Title = 'Sales Rep';


-- Section B

-- 5. Targeted Product Search
SELECT ProductName, Price
FROM Product
WHERE SupplierID = 1
  AND Price > 18.00;

-- 6. Regional Customers
SELECT CompanyName
FROM Customer
WHERE Country = 'Germany'
   OR Country = 'Mexico';

-- 7. Excluded Regions
SELECT CompanyName, Country
FROM Customer
WHERE Country <> 'UK';

-- 8. Specific Orders
SELECT OrderID, CustomerID
FROM Orders
WHERE OrderDate >= '2025-07-05';


-- Section C

-- 9. Product Categories
SELECT Product.ProductName, Category.CategoryName
FROM Product, Category
WHERE Product.CategoryID = Category.CategoryID;

-- 10. Supplier Locations
SELECT Product.ProductName, Supplier.City
FROM Product, Supplier
WHERE Product.SupplierID = Supplier.SupplierID;

-- 11. Order Responsibilities
SELECT Orders.OrderID, Employee.LastName
FROM Orders, Employee
WHERE Orders.EmployeeID = Employee.EmployeeID;

-- 12. The "Tofu" Challenge
SELECT Product.ProductName, Category.CategoryName
FROM Product, Category
WHERE Product.CategoryID = Category.CategoryID
  AND Category.CategoryName <> 'Seafood';