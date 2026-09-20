/* Bài tập ASP.NET Core — chấm theo rubric */

export default [
{
  id: 'net-01', lang: 'dotnet', level: 'Cơ bản', topic: 'Controller',
  title: 'Controller CRUD cơ bản',
  io: {
    given: `public interface IProductService
{
    Task<IEnumerable<ProductDto>> ListAsync();
    Task<ProductDto?> GetByIdAsync(int id);                 // null = không tìm thấy
    Task<ProductDto> CreateAsync(CreateProductDto dto);
    Task<bool> UpdateAsync(int id, UpdateProductDto dto);   // false = không tìm thấy
    Task<bool> DeleteAsync(int id);                         // false = không tìm thấy
}

public record ProductDto(int Id, string Name, decimal Price, string Sku);
public record CreateProductDto(string Name, decimal Price, string Sku);
public record UpdateProductDto(string Name, decimal Price);`
  },
  brief: `<p>Viết <code>ProductsController</code> với đủ 5 endpoint CRUD, dùng <code>IProductService</code> được tiêm qua constructor.</p>
<ul>
<li><code>GET /api/products</code> — danh sách</li>
<li><code>GET /api/products/{id}</code> — một sản phẩm, 404 nếu không có</li>
<li><code>POST /api/products</code> — tạo mới, trả 201</li>
<li><code>PUT /api/products/{id}</code> — cập nhật, 204</li>
<li><code>DELETE /api/products/{id}</code> — xoá, 204</li>
</ul>`,
  starter: `[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    // Tiêm IProductService và viết 5 action ở đây
}`,
  hints: ['Dùng primary constructor: public class ProductsController(IProductService service) : ControllerBase', 'ActionResult<T> cho phép vừa trả dữ liệu vừa trả status code.', 'Mọi action gọi database đều phải async Task.'],
  rubric: [
    'Có [ApiController] và [Route("api/[controller]")]',
    'Tiêm IProductService qua constructor, không tự new',
    'Đủ 5 action với đúng attribute HTTP method',
    'Tất cả action đều async Task và await service',
    'GET theo id trả NotFound() khi không tìm thấy',
    'POST trả 201 (CreatedAtAction hoặc Created)',
    'PUT và DELETE trả NoContent()'
  ],
  solution: `[ApiController]
[Route("api/[controller]")]
public class ProductsController(IProductService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll()
        => Ok(await service.ListAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var product = await service.GetByIdAsync(id);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create(CreateProductDto dto)
    {
        var created = await service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateProductDto dto)
    {
        var ok = await service.UpdateAsync(id, dto);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await service.DeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }
}`
},
{
  id: 'net-02', lang: 'dotnet', level: 'Cơ bản', topic: 'Controller',
  title: 'Trả đúng status code',
  io: {
    given: `public interface IOrderService
{
    Task<OrderDto> CreateAsync(int userId, CreateOrderDto dto);
    Task<OrderDto?> GetByIdAsync(int id);
}

public record CreateOrderDto(int ProductId, int Quantity);
public record OrderDto(int Id, int ProductId, int Quantity, decimal Total);

public class NotFoundException(string message) : Exception(message);
public class OutOfStockException(string message) : Exception(message);`,
    note: 'Trong controller đã có sẵn: trường service (IOrderService), action GetById(int id) để CreatedAtAction trỏ tới, và extension method User.GetUserId() trả về int id của người đang đăng nhập.'
  },
  brief: `<p>Viết action <code>Create</code> cho <code>OrdersController</code> trả về status code chính xác cho từng tình huống:</p>
<ul>
<li>Tạo thành công → <strong>201</strong> kèm header <code>Location</code></li>
<li>Sản phẩm không tồn tại → <strong>404</strong> kèm thông điệp</li>
<li>Không đủ tồn kho → <strong>409 Conflict</strong></li>
<li>Người dùng chưa đăng nhập → <strong>401</strong> (do attribute, không viết tay)</li>
</ul>
<p>Giả sử service ném <code>NotFoundException</code> và <code>OutOfStockException</code>.</p>`,
  starter: `[HttpPost]
[Authorize]
public async Task<ActionResult<OrderDto>> Create(CreateOrderDto dto)
{
    // Viết code ở đây
}`,
  hints: ['CreatedAtAction(nameof(GetById), new { id = created.Id }, created) tự sinh header Location.', 'Conflict() cho 409.', 'Không tự viết if kiểm tra đăng nhập — [Authorize] lo việc đó.'],
  rubric: [
    'Trả CreatedAtAction hoặc Created với header Location khi thành công',
    'Bắt NotFoundException và trả NotFound với thông điệp',
    'Bắt OutOfStockException và trả Conflict() (409)',
    'Có [Authorize] thay vì tự kiểm tra đăng nhập trong code',
    'Action là async Task và có await'
  ],
  solution: `[HttpPost]
[Authorize]
public async Task<ActionResult<OrderDto>> Create(CreateOrderDto dto)
{
    try
    {
        var created = await service.CreateAsync(User.GetUserId(), dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
    catch (NotFoundException ex)
    {
        return NotFound(new { message = ex.Message });
    }
    catch (OutOfStockException ex)
    {
        return Conflict(new { message = ex.Message });
    }
}`
},
{
  id: 'net-03', lang: 'dotnet', level: 'Cơ bản', topic: 'Kiến trúc',
  title: 'DTO và mapping',
  io: {
    given: `public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;   // không được lộ ra API
    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }                   // không được lộ ra API
    public string? InternalNote { get; set; }                  // không được lộ ra API
}`,
    note: 'Đề bài chỉ cho sẵn entity User. UserDto, CreateUserDto và lớp UserMappings là phần bạn tự khai báo.'
  },
  brief: `<p>Cho entity <code>User</code> có <code>Id, Email, FullName, PasswordHash, CreatedAt, DeletedAt, InternalNote</code>.</p>
<p>Hãy định nghĩa:</p>
<ul>
<li><code>UserDto</code> — dữ liệu trả ra API, tuyệt đối không lộ trường nhạy cảm</li>
<li><code>CreateUserDto</code> — dữ liệu nhận vào khi đăng ký</li>
<li>Một extension method <code>ToDto()</code> chuyển entity sang DTO</li>
</ul>`,
  starter: `public record UserDto(/* ... */);
public record CreateUserDto(/* ... */);

public static class UserMappings
{
    public static UserDto ToDto(this User user) => /* ... */;
}`,
  hints: ['record là lựa chọn tự nhiên cho DTO vì bất biến và so sánh theo giá trị.', 'DTO vào và DTO ra khác nhau: một cái có Password, cái kia có Id.'],
  rubric: [
    'UserDto không chứa PasswordHash, DeletedAt hay InternalNote',
    'CreateUserDto có Password nhưng không có Id',
    'Dùng record (hoặc class bất biến) cho DTO',
    'ToDto() là extension method và ánh xạ đúng các trường',
    'Không trả entity User trực tiếp ở bất kỳ đâu'
  ],
  solution: `public record UserDto(int Id, string Email, string FullName, DateTime CreatedAt);

public record CreateUserDto(string Email, string FullName, string Password);

public static class UserMappings
{
    public static UserDto ToDto(this User user)
        => new(user.Id, user.Email, user.FullName, user.CreatedAt);
}`
},
{
  id: 'net-04', lang: 'dotnet', level: 'Cơ bản', topic: 'Validation',
  title: 'Validation bằng Data Annotations',
  io: {
    note: 'Không có kiểu nào cho sẵn — bạn khai báo trọn lớp CreateProductDto từ đầu. Controller đã có [ApiController], nên ModelState được kiểm tra tự động; đó chính là điều cần giải thích ở cuối bài. Các attribute cần dùng nằm trong namespace System.ComponentModel.DataAnnotations.'
  },
  brief: `<p>Viết <code>CreateProductDto</code> với ràng buộc đầy đủ và thông điệp lỗi tiếng Việt:</p>
<ul>
<li><code>Name</code>: bắt buộc, 3–100 ký tự</li>
<li><code>Price</code>: bắt buộc, lớn hơn 0, tối đa 1 tỷ</li>
<li><code>Sku</code>: bắt buộc, đúng định dạng 3 chữ hoa + gạch + 4 số (ví dụ <code>ABC-1234</code>)</li>
<li><code>CategoryId</code>: bắt buộc, số nguyên dương</li>
<li><code>Description</code>: tuỳ chọn, tối đa 2000 ký tự</li>
</ul>
<p>Giải thích ngắn gọn vì sao không cần viết <code>if (!ModelState.IsValid)</code> trong controller.</p>`,
  starter: `public class CreateProductDto
{
    // Thêm thuộc tính và attribute validation ở đây
}`,
  hints: ['[Required], [StringLength], [Range], [RegularExpression] là bốn attribute dùng nhiều nhất.', 'ErrorMessage đặt được cho từng attribute.', '[ApiController] tự động trả 400 với chi tiết lỗi.'],
  rubric: [
    'Name có [Required] và giới hạn độ dài 3–100',
    'Price có [Range] chặn giá trị 0 và số âm',
    'Sku có [RegularExpression] đúng mẫu 3 chữ hoa, gạch, 4 số',
    'CategoryId có ràng buộc số nguyên dương',
    'Description có giới hạn độ dài nhưng không bắt buộc',
    'Mọi attribute đều có ErrorMessage tiếng Việt',
    'Giải thích được rằng [ApiController] tự trả 400 nên không cần kiểm tra ModelState'
  ],
  solution: `public class CreateProductDto
{
    [Required(ErrorMessage = "Tên sản phẩm là bắt buộc")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Tên phải từ 3 đến 100 ký tự")]
    public string Name { get; set; } = string.Empty;

    [Range(0.01, 1_000_000_000, ErrorMessage = "Giá phải lớn hơn 0")]
    public decimal Price { get; set; }

    [Required(ErrorMessage = "SKU là bắt buộc")]
    [RegularExpression(@"^[A-Z]{3}-\\d{4}$", ErrorMessage = "SKU phải có dạng ABC-1234")]
    public string Sku { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "Danh mục không hợp lệ")]
    public int CategoryId { get; set; }

    [StringLength(2000, ErrorMessage = "Mô tả tối đa 2000 ký tự")]
    public string? Description { get; set; }
}
// [ApiController] tự động trả 400 ProblemDetails khi ModelState không hợp lệ.`
},
{
  id: 'net-05', lang: 'dotnet', level: 'Trung bình', topic: 'DI',
  title: 'Đăng ký DI đúng vòng đời',
  io: {
    given: `// Các kiểu dưới đây đã tồn tại, bạn chỉ viết phần đăng ký:
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options);

public interface IOrderRepository;    public class EfOrderRepository : IOrderRepository;
public interface IOrderService;       public class OrderService : IOrderService;
public interface IPriceCalculator;    public class PriceCalculator : IPriceCalculator;
public interface ICacheProvider;      public class MemoryCacheProvider : ICacheProvider;

// appsettings.json đã có:
// "ConnectionStrings": { "Default": "Host=localhost;Database=shop;..." }`
  },
  brief: `<p>Viết phần đăng ký dịch vụ trong <code>Program.cs</code> cho các thành phần sau, chọn đúng vòng đời cho từng cái và giải thích lý do bằng comment:</p>
<ul>
<li><code>AppDbContext</code> — EF Core, nối PostgreSQL</li>
<li><code>IOrderRepository</code> → <code>EfOrderRepository</code></li>
<li><code>IOrderService</code> → <code>OrderService</code></li>
<li><code>IPriceCalculator</code> → <code>PriceCalculator</code> (thuần tính toán, không trạng thái)</li>
<li><code>ICacheProvider</code> → <code>MemoryCacheProvider</code> (giữ cache dùng chung toàn ứng dụng)</li>
</ul>`,
  starter: `var builder = WebApplication.CreateBuilder(args);

// Đăng ký các dịch vụ ở đây

var app = builder.Build();`,
  hints: ['Thứ gì chạm database → Scoped.', 'Thứ giữ trạng thái dùng chung cả ứng dụng → Singleton.', 'Không bao giờ tiêm Scoped vào Singleton.'],
  rubric: [
    'AppDbContext đăng ký bằng AddDbContext với UseNpgsql',
    'IOrderRepository là Scoped',
    'IOrderService là Scoped',
    'IPriceCalculator là Transient hoặc Singleton (không trạng thái)',
    'ICacheProvider là Singleton',
    'Có comment giải thích lý do chọn vòng đời',
    'Chuỗi kết nối lấy từ Configuration, không viết cứng trong code'
  ],
  solution: `var builder = WebApplication.CreateBuilder(args);

// Scoped: một DbContext cho mỗi request, huỷ khi request kết thúc
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// Scoped: dùng chung DbContext trong một request
builder.Services.AddScoped<IOrderRepository, EfOrderRepository>();
builder.Services.AddScoped<IOrderService, OrderService>();

// Transient: không giữ trạng thái, tạo mới rẻ
builder.Services.AddTransient<IPriceCalculator, PriceCalculator>();

// Singleton: cache dùng chung toàn ứng dụng
builder.Services.AddSingleton<ICacheProvider, MemoryCacheProvider>();

var app = builder.Build();`
},
{
  id: 'net-06', lang: 'dotnet', level: 'Trung bình', topic: 'Kiến trúc',
  title: 'Repository pattern',
  io: {
    given: `public class Order
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderItem> Items { get; set; } = [];
}

// AppDbContext đã có sẵn, trong đó có DbSet<Order> Orders.
// Biến db được tiêm qua primary constructor của EfOrderRepository.`
  },
  brief: `<p>Định nghĩa <code>IOrderRepository</code> và cài đặt <code>EfOrderRepository</code> dùng <code>AppDbContext</code>.</p>
<p>Interface cần các phương thức: <code>GetByIdAsync</code>, <code>ListByCustomerAsync</code> (có phân trang), <code>AddAsync</code>, <code>SaveChangesAsync</code>.</p>
<p>Yêu cầu: interface không được lộ bất kỳ kiểu nào của EF Core (<code>IQueryable</code>, <code>DbSet</code>) ra ngoài.</p>`,
  starter: `public interface IOrderRepository
{
    // Khai báo phương thức ở đây
}

public class EfOrderRepository(AppDbContext db) : IOrderRepository
{
    // Cài đặt ở đây
}`,
  hints: ['Trả IReadOnlyList<T> thay vì IQueryable để không rò rỉ chi tiết ORM.', 'Thêm CancellationToken vào mọi phương thức async là thói quen tốt.', 'AsNoTracking cho truy vấn chỉ đọc.'],
  rubric: [
    'Interface không chứa IQueryable hay kiểu EF Core nào',
    'Phương thức async trả Task và có hậu tố Async',
    'ListByCustomerAsync nhận tham số phân trang (skip/take hoặc page/size)',
    'Dùng AsNoTracking cho truy vấn chỉ đọc',
    'AppDbContext được tiêm qua constructor',
    'Có CancellationToken hoặc giải thích vì sao bỏ qua'
  ],
  solution: `public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<Order>> ListByCustomerAsync(int customerId, int skip, int take, CancellationToken ct = default);
    Task AddAsync(Order order, CancellationToken ct = default);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public class EfOrderRepository(AppDbContext db) : IOrderRepository
{
    public Task<Order?> GetByIdAsync(int id, CancellationToken ct = default)
        => db.Orders.FirstOrDefaultAsync(o => o.Id == id, ct);

    public async Task<IReadOnlyList<Order>> ListByCustomerAsync(int customerId, int skip, int take, CancellationToken ct = default)
        => await db.Orders.AsNoTracking()
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.CreatedAt)
            .Skip(skip).Take(take)
            .ToListAsync(ct);

    public async Task AddAsync(Order order, CancellationToken ct = default)
        => await db.Orders.AddAsync(order, ct);

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => db.SaveChangesAsync(ct);
}`
},
{
  id: 'net-07', lang: 'dotnet', level: 'Trung bình', topic: 'EF Core',
  title: 'DbContext và cấu hình quan hệ',
  io: {
    given: `public class Order
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderItem> Items { get; set; } = [];
}

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class Product
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public int CategoryId { get; set; }
}`
  },
  brief: `<p>Viết <code>AppDbContext</code> cho ba entity: <code>Order</code>, <code>OrderItem</code>, <code>Product</code>.</p>
<ul>
<li>Một <code>Order</code> có nhiều <code>OrderItem</code> (1–n), xoá đơn thì xoá luôn item</li>
<li>Mỗi <code>OrderItem</code> trỏ tới một <code>Product</code>, <strong>không</strong> được xoá sản phẩm khi còn item tham chiếu</li>
<li><code>Product.Sku</code> phải unique</li>
<li><code>Product.Price</code> dùng kiểu <code>decimal(18,2)</code></li>
<li><code>Order.CreatedAt</code> mặc định thời điểm hiện tại ở phía database</li>
</ul>`,
  starter: `public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet và OnModelCreating ở đây
}`,
  hints: ['OnDelete(DeleteBehavior.Cascade) và DeleteBehavior.Restrict là hai hành vi bạn cần.', 'HasIndex(...).IsUnique() cho ràng buộc unique.', 'HasDefaultValueSql("now()") cho PostgreSQL.'],
  rubric: [
    'Có DbSet cho cả ba entity',
    'Quan hệ Order–OrderItem cấu hình đúng 1–n với Cascade',
    'Quan hệ OrderItem–Product dùng DeleteBehavior.Restrict',
    'Sku có index unique',
    'Price cấu hình kiểu decimal(18,2) hoặc HasPrecision(18, 2)',
    'CreatedAt có giá trị mặc định phía database'
  ],
  solution: `public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Order>(e =>
        {
            e.HasMany(o => o.Items)
                .WithOne(i => i.Order)
                .HasForeignKey(i => i.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            e.Property(o => o.CreatedAt).HasDefaultValueSql("now()");
        });

        b.Entity<OrderItem>()
            .HasOne(i => i.Product)
            .WithMany()
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<Product>(e =>
        {
            e.HasIndex(p => p.Sku).IsUnique();
            e.Property(p => p.Price).HasPrecision(18, 2);
        });
    }
}`
},
{
  id: 'net-08', lang: 'dotnet', level: 'Trung bình', topic: 'EF Core',
  title: 'Truy vấn phân trang có tổng số',
  io: {
    given: `public record ProductQuery(int Page, int Size, int? CategoryId, string? Keyword, bool SortDesc);

public record ProductDto(int Id, string Name, decimal Price, string Sku);

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int Size, int Total, int TotalPages);

// Product: Id, Name, Price, Sku, Stock, CategoryId
// db (AppDbContext) đã được tiêm qua constructor của service.`,
    note: 'query.Page có thể nhỏ hơn 1, query.Size có thể là 0 hoặc 5000 — cả hai phải được kẹp lại. CategoryId và Keyword đều có thể null, nghĩa là không lọc theo tiêu chí đó.'
  },
  brief: `<p>Viết phương thức <code>ListAsync</code> trả về <code>PagedResult&lt;ProductDto&gt;</code> gồm <code>Items, Page, Size, Total, TotalPages</code>.</p>
<ul>
<li>Lọc tuỳ chọn theo <code>categoryId</code> và từ khoá trong tên</li>
<li>Sắp xếp theo giá tăng hoặc giảm tuỳ tham số</li>
<li>Kẹp <code>size</code> vào khoảng 1–100</li>
<li>Chỉ thực hiện <strong>hai</strong> truy vấn: một đếm tổng, một lấy trang</li>
<li>Chiếu thẳng sang DTO trong truy vấn, không tải entity đầy đủ</li>
</ul>`,
  starter: `public async Task<PagedResult<ProductDto>> ListAsync(ProductQuery query, CancellationToken ct = default)
{
    // Viết code ở đây
}`,
  hints: ['Dựng IQueryable dần bằng các câu if rồi mới gọi CountAsync và ToListAsync.', 'Select(...) trước ToListAsync giúp EF chỉ SELECT đúng cột cần.', 'Nhớ OrderBy trước Skip/Take, nếu không thứ tự không xác định.'],
  rubric: [
    'Dựng IQueryable có điều kiện, chỉ thực thi ở cuối',
    'Đúng hai lần truy vấn database: CountAsync và ToListAsync',
    'Có Select chiếu sang DTO trước khi ToListAsync',
    'size được kẹp trong khoảng 1–100',
    'Có OrderBy trước Skip/Take',
    'Dùng AsNoTracking',
    'TotalPages tính đúng bằng Math.Ceiling'
  ],
  solution: `public async Task<PagedResult<ProductDto>> ListAsync(ProductQuery query, CancellationToken ct = default)
{
    var page = Math.Max(1, query.Page);
    var size = Math.Clamp(query.Size, 1, 100);

    var q = db.Products.AsNoTracking();

    if (query.CategoryId is int catId)
        q = q.Where(p => p.CategoryId == catId);

    if (!string.IsNullOrWhiteSpace(query.Keyword))
        q = q.Where(p => p.Name.Contains(query.Keyword));

    var total = await q.CountAsync(ct);

    q = query.SortDesc
        ? q.OrderByDescending(p => p.Price)
        : q.OrderBy(p => p.Price);

    var items = await q
        .Skip((page - 1) * size)
        .Take(size)
        .Select(p => new ProductDto(p.Id, p.Name, p.Price, p.Sku))
        .ToListAsync(ct);

    return new PagedResult<ProductDto>(items, page, size, total,
        (int)Math.Ceiling(total / (double)size));
}`
},
{
  id: 'net-09', lang: 'dotnet', level: 'Trung bình', topic: 'EF Core',
  title: 'Diệt N+1 query',
  io: {
    given: `// Các entity đang dùng:
// Order:     Id, CustomerId, Customer, Items (List<OrderItem>), CreatedAt
// Customer:  Id, FullName
// OrderItem: Id, OrderId, ProductId, Product, Quantity
// Product:   Id, Name, Price

public record OrderDto(int Id, string CustomerName, List<OrderItemDto> Items);
public record OrderItemDto(int ProductId, string ProductName, int Quantity);

// db (AppDbContext), customerId (int) và ct (CancellationToken) đều đã có sẵn.`
  },
  brief: `<p>Đoạn code dưới đây sinh ra N+1 query. Hãy viết lại cho đúng và giải thích ngắn gọn số truy vấn trước và sau khi sửa.</p>
<pre><code>var orders = await db.Orders
    .Where(o =&gt; o.CustomerId == customerId)
    .ToListAsync();

foreach (var order in orders)
{
    order.Customer = await db.Customers.FindAsync(order.CustomerId);
    order.Items = await db.OrderItems.Where(i =&gt; i.OrderId == order.Id).ToListAsync();
}
return orders;</code></pre>
<p>Hãy đưa ra <strong>hai</strong> cách sửa: dùng <code>Include</code>, và dùng <code>Select</code> chiếu sang DTO.</p>`,
  starter: `// Cách 1: Include

// Cách 2: chiếu sang DTO

// Giải thích số truy vấn trước và sau:`,
  hints: ['Include kéo theo cả entity liên quan trong một lần đi database.', 'ThenInclude dùng khi cần đi sâu hai cấp.', 'Chiếu sang DTO thường nhanh hơn Include vì chỉ lấy đúng cột cần.'],
  rubric: [
    'Cách 1 dùng Include (và ThenInclude nếu cần) thay cho vòng lặp',
    'Cách 2 dùng Select chiếu sang DTO, không tải entity đầy đủ',
    'Không còn await nào bên trong vòng lặp foreach',
    'Có AsNoTracking cho truy vấn chỉ đọc',
    'Giải thích được rằng code cũ tốn 1 + 2N truy vấn, code mới tốn 1',
    'Nêu được rằng chiếu DTO thường nhẹ hơn Include vì chỉ lấy cột cần'
  ],
  solution: `// Cách 1: Include — một truy vấn, trả về entity đầy đủ
var orders = await db.Orders
    .AsNoTracking()
    .Where(o => o.CustomerId == customerId)
    .Include(o => o.Customer)
    .Include(o => o.Items)
        .ThenInclude(i => i.Product)
    .ToListAsync(ct);

// Cách 2: chiếu sang DTO — một truy vấn, chỉ lấy đúng cột cần
var dtos = await db.Orders
    .AsNoTracking()
    .Where(o => o.CustomerId == customerId)
    .Select(o => new OrderDto(
        o.Id,
        o.Customer.FullName,
        o.Items.Select(i => new OrderItemDto(i.ProductId, i.Product.Name, i.Quantity)).ToList()))
    .ToListAsync(ct);

// Trước: 1 truy vấn lấy đơn + 2 truy vấn cho mỗi đơn = 1 + 2N.
// Với 100 đơn là 201 lần đi database.
// Sau: đúng 1 truy vấn. Cách 2 nhẹ hơn vì không tải cột không dùng.`
},
{
  id: 'net-10', lang: 'dotnet', level: 'Nâng cao', topic: 'EF Core',
  title: 'Transaction nhiều bảng',
  io: {
    given: `public record CreateOrderDto(int ProductId, int Quantity);
public record OrderDto(int Id, int ProductId, int Quantity, decimal Total);

public class NotFoundException(string message) : Exception(message);
public class OutOfStockException(string message) : Exception(message);

// Product:       Id, Name, Price, Stock
// Order:         Id, CustomerId, Items (List<OrderItem>), CreatedAt
// OrderItem:     Id, OrderId, ProductId, Quantity, UnitPrice
// StockMovement: Id, ProductId, Delta (int), Reason (string), CreatedAt

// db (AppDbContext) có: Products, Orders, StockMovements
// Extension order.ToDto() đã có sẵn.`
  },
  brief: `<p>Viết <code>PlaceOrderAsync</code> thực hiện đặt hàng trong một transaction:</p>
<ol>
<li>Kiểm tra sản phẩm tồn tại và đủ tồn kho</li>
<li>Trừ tồn kho</li>
<li>Tạo đơn hàng và chi tiết đơn</li>
<li>Ghi một dòng vào bảng <code>StockMovement</code></li>
</ol>
<p>Nếu bất kỳ bước nào thất bại, toàn bộ phải quay lại như cũ. Ném <code>OutOfStockException</code> khi không đủ hàng.</p>`,
  starter: `public async Task<OrderDto> PlaceOrderAsync(int customerId, CreateOrderDto dto, CancellationToken ct = default)
{
    // Viết code ở đây
}`,
  hints: ['db.Database.BeginTransactionAsync() trả về đối tượng cần using.', 'using var tx = ... tự động rollback nếu không gọi CommitAsync.', 'Nghĩ tới race condition: hai người cùng mua sản phẩm cuối cùng.'],
  rubric: [
    'Dùng BeginTransactionAsync với using để đảm bảo rollback',
    'Kiểm tra tồn tại sản phẩm và trả lỗi rõ ràng khi không có',
    'Ném OutOfStockException khi tồn kho không đủ',
    'Trừ tồn kho, tạo Order, OrderItem và StockMovement trong cùng transaction',
    'Gọi CommitAsync ở cuối, sau khi mọi thao tác thành công',
    'Có đề cập tới xử lý truy cập đồng thời (concurrency token, khoá dòng, hoặc ràng buộc CHECK ở database)'
  ],
  solution: `public async Task<OrderDto> PlaceOrderAsync(int customerId, CreateOrderDto dto, CancellationToken ct = default)
{
    await using var tx = await db.Database.BeginTransactionAsync(ct);

    var product = await db.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId, ct)
        ?? throw new NotFoundException($"Không tìm thấy sản phẩm {dto.ProductId}");

    if (product.Stock < dto.Quantity)
        throw new OutOfStockException($"Chỉ còn {product.Stock} sản phẩm");

    product.Stock -= dto.Quantity;

    var order = new Order
    {
        CustomerId = customerId,
        Items = { new OrderItem { ProductId = product.Id, Quantity = dto.Quantity, UnitPrice = product.Price } }
    };
    db.Orders.Add(order);

    db.StockMovements.Add(new StockMovement
    {
        ProductId = product.Id,
        Delta = -dto.Quantity,
        Reason = "order"
    });

    await db.SaveChangesAsync(ct);
    await tx.CommitAsync(ct);

    return order.ToDto();
}

// Chống đặt trùng khi hai người mua cùng lúc: thêm concurrency token
// (RowVersion) trên Product, hoặc ràng buộc CHECK (stock >= 0) ở database.`
},
{
  id: 'net-11', lang: 'dotnet', level: 'Trung bình', topic: 'Xử lý lỗi',
  title: 'Middleware xử lý lỗi toàn cục',
  io: {
    given: `public class ValidationException(string message) : Exception(message);
public class NotFoundException(string message) : Exception(message);
public class OutOfStockException(string message) : Exception(message);

// Tham số của TryHandleAsync:
//   context    HttpContext         ghi status code và body vào context.Response
//   exception  Exception           lỗi vừa xảy ra: một trong ba kiểu trên, hoặc kiểu bất kỳ
//   ct         CancellationToken
// Trả về true nghĩa là đã xử lý xong, pipeline dừng tại đây.
// logger (ILogger<GlobalExceptionHandler>) được tiêm qua primary constructor.`
  },
  brief: `<p>Viết một <code>IExceptionHandler</code> chuyển exception thành <code>ProblemDetails</code> thống nhất, và đăng ký nó trong <code>Program.cs</code>.</p>
<ul>
<li><code>ValidationException</code> → 422</li>
<li><code>NotFoundException</code> → 404</li>
<li><code>OutOfStockException</code> → 409</li>
<li>Còn lại → 500 với thông điệp chung, <strong>không lộ</strong> chi tiết nội bộ</li>
<li>Mọi response đều kèm <code>traceId</code>, và lỗi 500 phải được ghi log ở mức Error</li>
</ul>`,
  starter: `public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context, Exception exception, CancellationToken ct)
    {
        // Viết code ở đây
    }
}`,
  hints: ['Activity.Current?.Id ?? context.TraceIdentifier cho traceId.', 'context.Response.WriteAsJsonAsync(problem, ct) để ghi kết quả.', 'Trả true nghĩa là đã xử lý xong, pipeline dừng ở đây.'],
  rubric: [
    'Ánh xạ đúng bốn nhóm exception sang status code tương ứng',
    'Lỗi 500 trả thông điệp chung, không lộ Message hay StackTrace gốc',
    'Có ghi log ở mức Error cho lỗi ngoài dự kiến',
    'ProblemDetails kèm traceId',
    'Đặt status code lên Response trước khi ghi body',
    'Có đăng ký AddExceptionHandler và AddProblemDetails cùng app.UseExceptionHandler trong Program.cs',
    'Trả về true để báo đã xử lý'
  ],
  solution: `public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context, Exception exception, CancellationToken ct)
    {
        var (status, title) = exception switch
        {
            ValidationException => (StatusCodes.Status422UnprocessableEntity, exception.Message),
            NotFoundException   => (StatusCodes.Status404NotFound, exception.Message),
            OutOfStockException => (StatusCodes.Status409Conflict, exception.Message),
            _                   => (StatusCodes.Status500InternalServerError, "Lỗi hệ thống")
        };

        if (status == StatusCodes.Status500InternalServerError)
            logger.LogError(exception, "Lỗi ngoài dự kiến tại {Path}", context.Request.Path);

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Instance = context.Request.Path,
            Extensions = { ["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier }
        };

        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(problem, ct);
        return true;
    }
}

// Program.cs
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
app.UseExceptionHandler();`
},
{
  id: 'net-12', lang: 'dotnet', level: 'Nâng cao', topic: 'Bảo mật',
  title: 'Cấu hình JWT authentication',
  io: {
    given: `// appsettings.json đã có:
// "Jwt": { "Issuer": "shop-api", "Audience": "shop-web", "Key": "chuoi-bi-mat-dai" }

// User: Id, Email, Roles (List<string>)

// Bạn viết hai phần:
//   1. builder.Services.AddAuthentication(...) trong Program.cs
//   2. string CreateAccessToken(User user) sinh chuỗi JWT`
  },
  brief: `<p>Viết phần cấu hình JWT Bearer trong <code>Program.cs</code> và một phương thức sinh token.</p>
<ul>
<li>Kiểm tra issuer, audience, thời hạn và chữ ký — không bỏ qua bất kỳ mục nào</li>
<li><code>ClockSkew</code> đặt về <code>TimeSpan.Zero</code> để token hết hạn đúng lúc</li>
<li>Khoá bí mật lấy từ cấu hình, không viết cứng</li>
<li>Token chứa claim <code>sub</code> (id người dùng), <code>email</code>, và các <code>role</code></li>
<li>Access token sống 15 phút</li>
</ul>`,
  starter: `// Program.cs

// Phương thức sinh token
public string GenerateAccessToken(User user)
{
    // Viết code ở đây
}`,
  hints: ['TokenValidationParameters có bốn cờ Validate* cần bật.', 'SymmetricSecurityKey nhận mảng byte từ Encoding.UTF8.GetBytes.', 'Mỗi role là một claim ClaimTypes.Role riêng.'],
  rubric: [
    'Bật đủ ValidateIssuer, ValidateAudience, ValidateLifetime, ValidateIssuerSigningKey',
    'ClockSkew = TimeSpan.Zero',
    'Khoá bí mật đọc từ Configuration, không viết cứng',
    'Token chứa claim sub, email và role',
    'Thời hạn access token là 15 phút',
    'Có AddAuthentication(JwtBearerDefaults.AuthenticationScheme) và AddJwtBearer',
    'Nhắc tới UseAuthentication đứng trước UseAuthorization'
  ],
  solution: `// Program.cs
var jwt = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwt["Secret"]!)),
            ClockSkew = TimeSpan.Zero
        };
    });

app.UseAuthentication();
app.UseAuthorization();

// Sinh token
public string GenerateAccessToken(User user)
{
    var claims = new List<Claim>
    {
        new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
        new(JwtRegisteredClaimNames.Email, user.Email),
        new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };
    claims.AddRange(user.Roles.Select(r => new Claim(ClaimTypes.Role, r)));

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
    var token = new JwtSecurityToken(
        issuer: _config["Jwt:Issuer"],
        audience: _config["Jwt:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(15),
        signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

    return new JwtSecurityTokenHandler().WriteToken(token);
}`
},
{
  id: 'net-13', lang: 'dotnet', level: 'Trung bình', topic: 'Bảo mật',
  title: 'Phân quyền theo role và policy',
  io: {
    given: `// OrdersController đã có sẵn bốn action:
//   GetAll()          danh sách mọi đơn
//   GetMyOrders()     đơn của chính người đang đăng nhập
//   Delete(int id)    xoá đơn
//   Refund(int id)    hoàn tiền

// Claim có trong token: role (có thể nhiều), department (ví dụ "finance")

// Bạn viết: các attribute [Authorize] đặt trên controller và trên từng action,
// cùng phần builder.Services.AddAuthorization(...) đăng ký policy CanRefund.`
  },
  brief: `<p>Cấu hình phân quyền cho <code>OrdersController</code>:</p>
<ul>
<li>Toàn bộ controller yêu cầu đăng nhập</li>
<li><code>GetAll</code> chỉ dành cho role <code>Admin</code> hoặc <code>Staff</code></li>
<li><code>Delete</code> chỉ dành cho <code>Admin</code></li>
<li><code>Refund</code> yêu cầu policy <code>CanRefund</code>: là Admin, hoặc là Staff có claim <code>department = finance</code></li>
<li><code>GetMyOrders</code> mở cho mọi người đã đăng nhập</li>
</ul>
<p>Viết cả phần đăng ký policy trong <code>Program.cs</code>.</p>`,
  starter: `// Program.cs — đăng ký policy

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    // Thêm attribute cho từng action
}`,
  hints: ['AddAuthorizationBuilder().AddPolicy("CanRefund", p => ...) là cú pháp hiện đại.', 'RequireAssertion cho điều kiện phức tạp có nhiều nhánh.', '[Authorize(Roles = "Admin,Staff")] nghĩa là HOẶC, không phải VÀ.'],
  rubric: [
    'Có [Authorize] ở cấp controller',
    'GetAll dùng [Authorize(Roles = "Admin,Staff")]',
    'Delete chỉ cho Admin',
    'Refund dùng [Authorize(Policy = "CanRefund")]',
    'Policy CanRefund kiểm tra đúng cả hai nhánh Admin và Staff có department=finance',
    'GetMyOrders không thêm ràng buộc role nào'
  ],
  solution: `// Program.cs
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("CanRefund", policy =>
        policy.RequireAssertion(ctx =>
            ctx.User.IsInRole("Admin") ||
            (ctx.User.IsInRole("Staff") &&
             ctx.User.HasClaim(c => c.Type == "department" && c.Value == "finance"))));

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController(IOrderService service) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetAll() => Ok(await service.ListAsync());

    [HttpGet("mine")]
    public async Task<IActionResult> GetMyOrders()
        => Ok(await service.ListByCustomerAsync(User.GetUserId()));

    [HttpPost("{id:int}/refund")]
    [Authorize(Policy = "CanRefund")]
    public async Task<IActionResult> Refund(int id)
    {
        await service.RefundAsync(id);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await service.DeleteAsync(id);
        return NoContent();
    }
}`
},
{
  id: 'net-14', lang: 'dotnet', level: 'Trung bình', topic: 'Bảo mật',
  title: 'Chặn IDOR trong service',
  io: {
    given: `public interface IOrderService
{
    Task<Order?> GetByIdAsync(int id);
}

// Order: Id, CustomerId (int — id của chủ đơn), Total, CreatedAt
// Claim trong token: NameIdentifier (hoặc sub) chứa id người dùng, role chứa vai trò

// Bạn viết: action GetById đã sửa, và extension method
//   public static int GetUserId(this ClaimsPrincipal user)`
  },
  brief: `<p>Action dưới đây có lỗ hổng IDOR: người dùng đã đăng nhập chỉ cần đổi id trên URL là xem được đơn của người khác.</p>
<pre><code>[HttpGet("{id:int}")]
[Authorize]
public async Task&lt;IActionResult&gt; GetById(int id)
{
    var order = await db.Orders.FindAsync(id);
    return order is null ? NotFound() : Ok(order.ToDto());
}</code></pre>
<p>Hãy sửa lại: chủ đơn hoặc Admin được xem, người khác nhận 404 (không tiết lộ đơn tồn tại). Viết thêm một extension method <code>GetUserId()</code> đọc id từ claim.</p>`,
  starter: `[HttpGet("{id:int}")]
[Authorize]
public async Task<IActionResult> GetById(int id)
{
    // Viết lại ở đây
}

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user) => /* ... */;
}`,
  hints: ['Lọc ngay trong truy vấn thay vì tải rồi mới kiểm tra — vừa an toàn vừa nhanh.', 'ClaimTypes.NameIdentifier hoặc JwtRegisteredClaimNames.Sub chứa id.', 'Trả 404 thay vì 403 là lựa chọn có chủ đích.'],
  rubric: [
    'Kiểm tra quyền sở hữu bằng cách so CustomerId với id người dùng hiện tại',
    'Admin vẫn xem được mọi đơn',
    'Trả NotFound (404) cho đơn của người khác, không phải Forbid',
    'GetUserId đọc claim đúng và xử lý được trường hợp claim thiếu',
    'Không trả entity trực tiếp, có ánh xạ sang DTO'
  ],
  solution: `[HttpGet("{id:int}")]
[Authorize]
public async Task<IActionResult> GetById(int id)
{
    var userId = User.GetUserId();
    var isAdmin = User.IsInRole("Admin");

    var order = await db.Orders
        .AsNoTracking()
        .Where(o => o.Id == id && (isAdmin || o.CustomerId == userId))
        .Select(o => new OrderDto(o.Id, o.Total, o.CreatedAt))
        .FirstOrDefaultAsync();

    // 404 cho cả "không tồn tại" lẫn "không phải của bạn"
    return order is null ? NotFound() : Ok(order);
}

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return int.TryParse(raw, out var id)
            ? id
            : throw new UnauthorizedAccessException("Token thiếu claim định danh");
    }
}`
},
{
  id: 'net-15', lang: 'dotnet', level: 'Trung bình', topic: 'Bảo mật',
  title: 'Đăng ký và đăng nhập an toàn',
  io: {
    given: `public interface ITokenService
{
    string CreateAccessToken(User user);
    string CreateRefreshToken(User user);
}

public record RegisterDto(string Email, string FullName, string Password);
public record LoginDto(string Email, string Password);
public record AuthResult(string AccessToken, string RefreshToken);

public class ConflictException(string message) : Exception(message);

// User: Id, Email, FullName, PasswordHash, CreatedAt
// db (AppDbContext) có DbSet<User> Users
// hasher (IPasswordHasher<User>) có:
//   HashPassword(user, password) -> string
//   VerifyHashedPassword(user, hash, password) -> PasswordVerificationResult`
  },
  brief: `<p>Viết <code>AuthService</code> với hai phương thức <code>RegisterAsync</code> và <code>LoginAsync</code>.</p>
<ul>
<li>Mật khẩu băm bằng <code>IPasswordHasher&lt;User&gt;</code> của ASP.NET Core</li>
<li>Email trùng → ném <code>ConflictException</code></li>
<li>Đăng nhập sai → luôn cùng một thông điệp, không phân biệt sai email hay sai mật khẩu</li>
<li>Đăng nhập thành công → trả access token và refresh token</li>
<li>Email lưu dưới dạng chữ thường để tránh trùng do khác hoa/thường</li>
</ul>`,
  starter: `public class AuthService(AppDbContext db, IPasswordHasher<User> hasher, ITokenService tokens)
{
    public async Task<UserDto> RegisterAsync(CreateUserDto dto, CancellationToken ct = default)
    {
        // Viết code ở đây
    }

    public async Task<AuthResult> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        // Viết code ở đây
    }
}`,
  hints: ['hasher.HashPassword(user, plain) và hasher.VerifyHashedPassword(...) là hai phương thức cần dùng.', 'VerifyHashedPassword trả về enum, nhớ so sánh với PasswordVerificationResult.Success.', 'Thông điệp lỗi đăng nhập giống nhau giúp không lộ email nào đã đăng ký.'],
  rubric: [
    'Dùng IPasswordHasher thay vì tự băm hoặc lưu mật khẩu thô',
    'Kiểm tra email trùng trước khi tạo và ném ConflictException',
    'Email được chuẩn hoá về chữ thường',
    'Thông điệp đăng nhập thất bại giống nhau cho cả hai trường hợp',
    'Có kiểm tra kết quả VerifyHashedPassword đúng cách',
    'Trả cả access token và refresh token khi thành công',
    'Không trả PasswordHash ra ngoài'
  ],
  solution: `public class AuthService(AppDbContext db, IPasswordHasher<User> hasher, ITokenService tokens)
{
    private const string LoginFailed = "Email hoặc mật khẩu không đúng";

    public async Task<UserDto> RegisterAsync(CreateUserDto dto, CancellationToken ct = default)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            throw new ConflictException("Email đã được đăng ký");

        var user = new User { Email = email, FullName = dto.FullName };
        user.PasswordHash = hasher.HashPassword(user, dto.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        return user.ToDto();
    }

    public async Task<AuthResult> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null)
            throw new UnauthorizedException(LoginFailed);

        var result = hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
        if (result == PasswordVerificationResult.Failed)
            throw new UnauthorizedException(LoginFailed);

        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = hasher.HashPassword(user, dto.Password);
            await db.SaveChangesAsync(ct);
        }

        return new AuthResult(tokens.CreateAccessToken(user), await tokens.CreateRefreshTokenAsync(user, ct));
    }
}`
},
{
  id: 'net-16', lang: 'dotnet', level: 'Trung bình', topic: 'Minimal API',
  title: 'Nhóm endpoint Minimal API',
  io: {
    given: `public interface IProductService
{
    Task<IEnumerable<ProductDto>> ListAsync();
    Task<ProductDto?> GetByIdAsync(int id);
    Task<ProductDto> CreateAsync(CreateProductDto dto);
    Task<bool> UpdateAsync(int id, UpdateProductDto dto);
    Task<bool> DeleteAsync(int id);
}

public record ProductDto(int Id, string Name, decimal Price, string Sku);
public record CreateProductDto(string Name, decimal Price, string Sku);
public record UpdateProductDto(string Name, decimal Price);

// Minimal API lấy service qua tham số của handler (DI tự động), không cần constructor.`
  },
  brief: `<p>Viết lại <code>ProductsController</code> thành Minimal API dùng <code>MapGroup</code>.</p>
<ul>
<li>Tất cả endpoint nằm dưới <code>/api/products</code></li>
<li><code>GET /</code> và <code>GET /{id}</code> công khai; <code>POST</code>, <code>PUT</code>, <code>DELETE</code> yêu cầu đăng nhập</li>
<li>Dùng <code>Results.Ok</code>, <code>Results.NotFound</code>, <code>Results.Created</code>, <code>Results.NoContent</code></li>
<li>Gom vào một extension method <code>MapProductEndpoints</code> để <code>Program.cs</code> gọn</li>
<li>Khai báo kiểu trả về cho tài liệu OpenAPI</li>
</ul>`,
  starter: `public static class ProductEndpoints
{
    public static RouteGroupBuilder MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        // Viết code ở đây
    }
}`,
  hints: ['MapGroup("/api/products") trả về RouteGroupBuilder có thể gắn RequireAuthorization.', 'Có thể tạo hai nhóm: một công khai, một cần đăng nhập.', 'Produces<T>() hoặc WithName giúp OpenAPI mô tả đúng.'],
  rubric: [
    'Dùng MapGroup thay vì lặp lại tiền tố đường dẫn',
    'Endpoint ghi có RequireAuthorization, endpoint đọc thì không',
    'Tham số service được lấy từ DI qua tham số của delegate',
    'Dùng đúng các hàm Results.* cho từng tình huống',
    'Toàn bộ gói trong extension method MapProductEndpoints',
    'Có khai báo kiểu trả về hoặc WithName cho OpenAPI'
  ],
  solution: `public static class ProductEndpoints
{
    public static RouteGroupBuilder MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/products").WithTags("Products");

        group.MapGet("/", async (IProductService svc, CancellationToken ct)
                => Results.Ok(await svc.ListAsync(ct)))
            .WithName("ListProducts")
            .Produces<IEnumerable<ProductDto>>();

        group.MapGet("/{id:int}", async (int id, IProductService svc, CancellationToken ct)
                => await svc.GetByIdAsync(id, ct) is { } p ? Results.Ok(p) : Results.NotFound())
            .WithName("GetProductById")
            .Produces<ProductDto>()
            .Produces(StatusCodes.Status404NotFound);

        var secured = group.MapGroup("").RequireAuthorization();

        secured.MapPost("/", async (CreateProductDto dto, IProductService svc, CancellationToken ct) =>
        {
            var created = await svc.CreateAsync(dto, ct);
            return Results.Created($"/api/products/{created.Id}", created);
        }).Produces<ProductDto>(StatusCodes.Status201Created);

        secured.MapPut("/{id:int}", async (int id, UpdateProductDto dto, IProductService svc, CancellationToken ct)
            => await svc.UpdateAsync(id, dto, ct) ? Results.NoContent() : Results.NotFound());

        secured.MapDelete("/{id:int}", async (int id, IProductService svc, CancellationToken ct)
            => await svc.DeleteAsync(id, ct) ? Results.NoContent() : Results.NotFound());

        return group;
    }
}

// Program.cs
app.MapProductEndpoints();`
},
{
  id: 'net-17', lang: 'dotnet', level: 'Trung bình', topic: 'Hiệu năng',
  title: 'Cache cho endpoint đọc nhiều',
  io: {
    given: `public record CategoryDto(int Id, string Name);

// Category: Id, Name
// db (AppDbContext) có DbSet<Category> Categories
// cache (IMemoryCache) được tiêm qua primary constructor

// Bạn viết các phương thức:
//   Task<IReadOnlyList<CategoryDto>> ListAsync()
//   CreateAsync(...), UpdateAsync(...), DeleteAsync(...) — mỗi cái phải xoá cache`
  },
  brief: `<p>Endpoint danh sách danh mục được gọi rất nhiều nhưng dữ liệu hiếm khi đổi. Hãy thêm cache bằng <code>IMemoryCache</code>.</p>
<ul>
<li>Cache 10 phút, đồng thời đặt <code>SlidingExpiration</code> 2 phút</li>
<li>Khi tạo, sửa hoặc xoá danh mục thì phải xoá cache ngay</li>
<li>Xử lý cả tình huống nhiều request cùng lúc gặp cache trống (cache stampede)</li>
<li>Khoá cache đặt trong hằng số, không rải chuỗi khắp nơi</li>
</ul>`,
  starter: `public class CategoryService(AppDbContext db, IMemoryCache cache)
{
    private const string CacheKey = "categories:all";

    public async Task<IReadOnlyList<CategoryDto>> ListAsync(CancellationToken ct = default)
    {
        // Viết code ở đây
    }

    public async Task CreateAsync(CreateCategoryDto dto, CancellationToken ct = default)
    {
        // Nhớ xoá cache
    }
}`,
  hints: ['GetOrCreateAsync nhận một factory chỉ chạy khi cache trống.', 'SemaphoreSlim là cách đơn giản chặn nhiều request cùng nạp lại cache.', 'cache.Remove(CacheKey) sau mọi thao tác ghi.'],
  rubric: [
    'Dùng GetOrCreateAsync hoặc kiểm tra TryGetValue rồi mới truy vấn',
    'Đặt cả AbsoluteExpirationRelativeToNow 10 phút và SlidingExpiration 2 phút',
    'Gọi cache.Remove sau mọi thao tác ghi',
    'Có cơ chế chống cache stampede (SemaphoreSlim hoặc tương đương)',
    'Khoá cache là hằng số dùng chung',
    'Truy vấn dùng AsNoTracking'
  ],
  solution: `public class CategoryService(AppDbContext db, IMemoryCache cache)
{
    private const string CacheKey = "categories:all";
    private static readonly SemaphoreSlim Gate = new(1, 1);

    public async Task<IReadOnlyList<CategoryDto>> ListAsync(CancellationToken ct = default)
    {
        if (cache.TryGetValue(CacheKey, out IReadOnlyList<CategoryDto>? cached) && cached is not null)
            return cached;

        await Gate.WaitAsync(ct);
        try
        {
            // Kiểm tra lại: request khác có thể đã nạp xong trong lúc chờ
            if (cache.TryGetValue(CacheKey, out cached) && cached is not null)
                return cached;

            var list = await db.Categories.AsNoTracking()
                .OrderBy(c => c.Name)
                .Select(c => new CategoryDto(c.Id, c.Name))
                .ToListAsync(ct);

            cache.Set(CacheKey, (IReadOnlyList<CategoryDto>)list, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
                SlidingExpiration = TimeSpan.FromMinutes(2)
            });

            return list;
        }
        finally { Gate.Release(); }
    }

    public async Task CreateAsync(CreateCategoryDto dto, CancellationToken ct = default)
    {
        db.Categories.Add(new Category { Name = dto.Name });
        await db.SaveChangesAsync(ct);
        cache.Remove(CacheKey);
    }
}`
},
{
  id: 'net-18', lang: 'dotnet', level: 'Nâng cao', topic: 'Công việc nền',
  title: 'BackgroundService gửi email',
  io: {
    given: `public class OutboxEmail
{
    public int Id { get; set; }
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";   // Pending | Sent | Failed
    public int RetryCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public interface IEmailSender
{
    Task SendAsync(string to, string subject, string body, CancellationToken ct);
}

// Tiêm qua primary constructor: IServiceScopeFactory scopeFactory,
//                               ILogger<EmailSenderService> logger
// AppDbContext chỉ lấy được BÊN TRONG một scope do scopeFactory tạo ra.`
  },
  brief: `<p>Viết một <code>BackgroundService</code> lấy email đang chờ trong bảng <code>OutboxEmail</code> và gửi đi.</p>
<ul>
<li>Chạy mỗi 30 giây, mỗi lượt lấy tối đa 20 email</li>
<li>Dùng <code>IServiceScopeFactory</code> để lấy <code>DbContext</code> — không tiêm thẳng vào constructor</li>
<li>Gửi thất bại thì tăng <code>RetryCount</code>, quá 5 lần thì đánh dấu <code>Failed</code></li>
<li>Một email lỗi không được làm dừng cả dịch vụ</li>
<li>Tôn trọng <code>stoppingToken</code> khi ứng dụng tắt</li>
</ul>`,
  starter: `public class EmailSenderService(
    IServiceScopeFactory scopeFactory,
    ILogger<EmailSenderService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Viết code ở đây
    }
}`,
  hints: ['BackgroundService là Singleton nên không tiêm được DbContext (Scoped) trực tiếp.', 'using var scope = scopeFactory.CreateScope(); rồi scope.ServiceProvider.GetRequiredService<AppDbContext>().', 'Bọc try/catch quanh từng email, không quanh cả vòng lặp ngoài.'],
  rubric: [
    'Dùng IServiceScopeFactory tạo scope cho mỗi lượt chạy',
    'Vòng lặp while kiểm tra stoppingToken.IsCancellationRequested',
    'Lấy tối đa 20 email mỗi lượt và chờ 30 giây giữa các lượt',
    'try/catch quanh từng email để một lỗi không dừng dịch vụ',
    'Tăng RetryCount và chuyển sang Failed sau 5 lần',
    'Có ghi log cho lỗi',
    'Truyền stoppingToken vào các lời gọi async'
  ],
  solution: `public class EmailSenderService(
    IServiceScopeFactory scopeFactory,
    ILogger<EmailSenderService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);
    private const int MaxRetries = 5;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var sender = scope.ServiceProvider.GetRequiredService<IEmailSender>();

                var pending = await db.OutboxEmails
                    .Where(e => e.Status == EmailStatus.Pending)
                    .OrderBy(e => e.CreatedAt)
                    .Take(20)
                    .ToListAsync(stoppingToken);

                foreach (var email in pending)
                {
                    try
                    {
                        await sender.SendAsync(email.To, email.Subject, email.Body, stoppingToken);
                        email.Status = EmailStatus.Sent;
                        email.SentAt = DateTime.UtcNow;
                    }
                    catch (Exception ex)
                    {
                        email.RetryCount++;
                        if (email.RetryCount >= MaxRetries) email.Status = EmailStatus.Failed;
                        logger.LogWarning(ex, "Gửi email {Id} thất bại lần {Count}", email.Id, email.RetryCount);
                    }
                }

                if (pending.Count > 0) await db.SaveChangesAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Lỗi trong vòng lặp gửi email");
            }

            try { await Task.Delay(Interval, stoppingToken); }
            catch (OperationCanceledException) { break; }
        }
    }
}`
},
{
  id: 'net-19', lang: 'dotnet', level: 'Trung bình', topic: 'Bảo mật',
  title: 'Rate limiting cho endpoint đăng nhập',
  io: {
    note: 'Không có kiểu nào cho sẵn. Bạn viết hai phần trong Program.cs: builder.Services.AddRateLimiter(...) khai báo hai policy, và app.UseRateLimiter(). Endpoint đăng nhập đã tồn tại ở POST /api/auth/login — việc của bạn là gắn policy "login" vào nó bằng RequireRateLimiting.'
  },
  brief: `<p>Dùng rate limiting có sẵn của ASP.NET Core để bảo vệ endpoint đăng nhập.</p>
<ul>
<li>Policy <code>"login"</code>: tối đa 5 lần trong 1 phút, phân theo địa chỉ IP</li>
<li>Policy <code>"api"</code>: 100 request mỗi phút cho toàn bộ API</li>
<li>Vượt giới hạn → trả 429 kèm header <code>Retry-After</code></li>
<li>Gắn policy <code>"login"</code> vào đúng endpoint đăng nhập</li>
</ul>`,
  starter: `// Program.cs — cấu hình rate limiter

// Gắn vào endpoint đăng nhập`,
  hints: ['AddRateLimiter với AddFixedWindowLimiter hoặc AddSlidingWindowLimiter.', 'RateLimitPartition.GetFixedWindowLimiter phân theo khoá tuỳ ý.', 'OnRejected là nơi đặt header Retry-After.'],
  rubric: [
    'Có AddRateLimiter và app.UseRateLimiter()',
    'Policy login giới hạn 5 request mỗi phút',
    'Phân vùng theo IP (RemoteIpAddress) chứ không dùng chung một bộ đếm',
    'Policy api giới hạn 100 request mỗi phút',
    'RejectionStatusCode là 429',
    'OnRejected đặt header Retry-After',
    'Endpoint đăng nhập có [EnableRateLimiting("login")] hoặc RequireRateLimiting'
  ],
  solution: `// Program.cs
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("login", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    options.AddFixedWindowLimiter("api", o =>
    {
        o.PermitLimit = 100;
        o.Window = TimeSpan.FromMinutes(1);
    });

    options.OnRejected = async (ctx, ct) =>
    {
        if (ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            ctx.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();

        await ctx.HttpContext.Response.WriteAsJsonAsync(
            new { message = "Quá nhiều yêu cầu, vui lòng thử lại sau" }, ct);
    };
});

app.UseRateLimiter();

// Endpoint
[HttpPost("login")]
[EnableRateLimiting("login")]
public async Task<IActionResult> Login(LoginDto dto) => Ok(await auth.LoginAsync(dto));`
},
{
  id: 'net-20', lang: 'dotnet', level: 'Cơ bản', topic: 'Vận hành',
  title: 'Health check',
  io: {
    given: `// appsettings.json đã có:
// "ConnectionStrings": { "Default": "Host=localhost;...", "Redis": "localhost:6379" }

// AppDbContext đã được đăng ký trong DI.
// Package gợi ý: AspNetCore.HealthChecks.NpgSql, AspNetCore.HealthChecks.Redis

// Bạn viết trong Program.cs: builder.Services.AddHealthChecks()...
// và hai lệnh app.MapHealthChecks(...) cho /health/live và /health/ready.`
  },
  brief: `<p>Cấu hình health check cho ứng dụng:</p>
<ul>
<li><code>/health/live</code> — chỉ kiểm tra tiến trình còn sống, <strong>không</strong> chạm database</li>
<li><code>/health/ready</code> — kiểm tra database và Redis</li>
<li>Kết quả trả về dạng JSON có tên từng thành phần và trạng thái</li>
<li>Database dùng tag <code>ready</code>, endpoint live lọc bỏ mọi check có tag</li>
</ul>
<p>Giải thích ngắn gọn vì sao liveness không nên gọi database.</p>`,
  starter: `// Program.cs

// Giải thích:`,
  hints: ['AddHealthChecks().AddDbContextCheck<AppDbContext>(tags: new[] { "ready" }).', 'MapHealthChecks có tham số Predicate để lọc theo tag.', 'ResponseWriter cho phép tự viết JSON trả về.'],
  rubric: [
    'Có AddHealthChecks với check cho DbContext và Redis',
    'Check database gắn tag "ready"',
    'Endpoint /health/live dùng Predicate loại bỏ mọi check',
    'Endpoint /health/ready lọc theo tag "ready"',
    'Có ResponseWriter trả JSON với tên và trạng thái từng check',
    'Giải thích được rằng liveness gọi database sẽ khiến sự cố database ngắn làm container tự khởi động lại liên tục'
  ],
  solution: `// Program.cs
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database", tags: ["ready"])
    .AddRedis(builder.Configuration.GetConnectionString("Redis")!, "redis", tags: ["ready"]);

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false            // không chạy check nào
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = async (ctx, report) =>
    {
        ctx.Response.ContentType = "application/json";
        await ctx.Response.WriteAsJsonAsync(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.ToDictionary(e => e.Key, e => e.Value.Status.ToString()),
            durationMs = report.TotalDuration.TotalMilliseconds
        });
    }
});

// Liveness không gọi database vì: nếu database chập chờn vài giây,
// orchestrator sẽ tưởng ứng dụng chết và khởi động lại container liên tục,
// biến một sự cố nhỏ thành sự cố toàn hệ thống.`
},
{
  id: 'net-21', lang: 'dotnet', level: 'Trung bình', topic: 'Vận hành',
  title: 'Serilog và traceId',
  io: {
    note: 'Không có kiểu nào cho sẵn. Bạn viết ba phần: cấu hình Serilog trong Program.cs (khác nhau giữa Development và Production), một middleware đẩy traceId và userId vào LogContext, và phần ghi traceId vào header response. traceId lấy từ Activity.Current?.Id ?? context.TraceIdentifier; userId lấy từ context.User khi đã đăng nhập.'
  },
  brief: `<p>Cấu hình Serilog cho ứng dụng và viết middleware gắn <code>traceId</code> vào mọi log của cùng một request.</p>
<ul>
<li>Log ra console dạng JSON khi ở môi trường Production, dạng dễ đọc khi Development</li>
<li>Mỗi log có <code>traceId</code>, <code>userId</code> (nếu đã đăng nhập) và đường dẫn request</li>
<li>Không bao giờ log body chứa mật khẩu hay token</li>
<li>Trả <code>traceId</code> về client trong header response</li>
</ul>`,
  starter: `// Program.cs — cấu hình Serilog

// Middleware gắn context
public class RequestContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        // Viết code ở đây
    }
}`,
  hints: ['LogContext.PushProperty(...) thêm thuộc tính cho mọi log trong phạm vi using.', 'app.UseSerilogRequestLogging() ghi sẵn một dòng tóm tắt cho mỗi request.', 'Enrich.FromLogContext() phải được bật thì PushProperty mới có tác dụng.'],
  rubric: [
    'Cấu hình Serilog khác nhau giữa Development và Production',
    'Có Enrich.FromLogContext()',
    'Middleware dùng LogContext.PushProperty cho traceId và userId',
    'traceId được ghi vào header response',
    'Có nhắc tới việc không log mật khẩu, token hay dữ liệu nhạy cảm',
    'Middleware gọi await next(context) đúng chỗ'
  ],
  solution: `// Program.cs
builder.Host.UseSerilog((ctx, cfg) =>
{
    cfg.ReadFrom.Configuration(ctx.Configuration)
       .Enrich.FromLogContext()
       .Enrich.WithProperty("Application", "ShopApi");

    if (ctx.HostingEnvironment.IsProduction())
        cfg.WriteTo.Console(new CompactJsonFormatter());
    else
        cfg.WriteTo.Console(outputTemplate:
            "[{Timestamp:HH:mm:ss} {Level:u3}] {TraceId} {Message:lj}{NewLine}{Exception}");
});

app.UseSerilogRequestLogging();
app.UseMiddleware<RequestContextMiddleware>();

public class RequestContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;
        context.Response.Headers["X-Trace-Id"] = traceId;

        var userId = context.User.Identity?.IsAuthenticated == true
            ? context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            : null;

        using (LogContext.PushProperty("TraceId", traceId))
        using (LogContext.PushProperty("UserId", userId ?? "anonymous"))
        using (LogContext.PushProperty("Path", context.Request.Path.Value))
        {
            await next(context);
        }
    }
}

// Không log request body ở endpoint đăng nhập, đổi mật khẩu hay thanh toán —
// chúng chứa mật khẩu, token và thông tin thẻ.`
},
{
  id: 'net-22', lang: 'dotnet', level: 'Trung bình', topic: 'Kiểm thử',
  title: 'Unit test cho service',
  io: {
    given: `public class DiscountService
{
    public decimal Calculate(Order order);   // trả về TỶ LỆ giảm, ví dụ 0.05m
}

public class Order
{
    public decimal Total { get; set; }         // tổng tiền trước giảm, đơn vị đồng
    public Customer Customer { get; set; } = null!;
}

public class Customer
{
    public bool IsVip { get; set; }
}`,
    note: 'Bạn không viết DiscountService — bạn viết test cho nó. Các mốc cần phủ: 499.999 / 500.000 / 1.999.999 / 2.000.000, mỗi mốc với cả khách thường lẫn khách VIP.'
  },
  brief: `<p>Viết unit test bằng xUnit cho <code>DiscountService.Calculate(order)</code> với quy tắc:</p>
<ul>
<li>Đơn dưới 500.000đ: không giảm</li>
<li>Từ 500.000đ đến dưới 2.000.000đ: giảm 5%</li>
<li>Từ 2.000.000đ trở lên: giảm 10%</li>
<li>Khách hàng VIP được cộng thêm 3%, nhưng tổng mức giảm không vượt quá 15%</li>
</ul>
<p>Viết đủ test cho các trường hợp biên. Dùng <code>[Theory]</code> với <code>[InlineData]</code> ở chỗ hợp lý.</p>`,
  starter: `public class DiscountServiceTests
{
    // Viết test ở đây
}`,
  hints: ['Giá trị biên cần test: đúng 500.000, 499.999, đúng 2.000.000.', '[Theory] + [InlineData] gọn hơn nhiều so với 6 hàm [Fact] gần giống nhau.', 'Đặt tên test theo mẫu Phương thức_Tình huống_KếtQuảMongĐợi.'],
  rubric: [
    'Có test cho cả ba bậc giảm giá',
    'Có test cho giá trị biên (đúng 500.000 và đúng 2.000.000)',
    'Có test cho khách VIP',
    'Có test cho trần 15%',
    'Dùng [Theory] với [InlineData] cho các trường hợp tương tự',
    'Tên test mô tả rõ tình huống và kết quả mong đợi',
    'Cấu trúc Arrange–Act–Assert rõ ràng'
  ],
  solution: `public class DiscountServiceTests
{
    private readonly DiscountService _service = new();

    [Theory]
    [InlineData(100_000, 0)]
    [InlineData(499_999, 0)]
    [InlineData(500_000, 0.05)]
    [InlineData(1_999_999, 0.05)]
    [InlineData(2_000_000, 0.10)]
    [InlineData(5_000_000, 0.10)]
    public void Calculate_TheoBacGiaTri_TraDungMucGiam(decimal total, decimal expected)
    {
        var order = new Order { Total = total, Customer = new Customer { IsVip = false } };

        var result = _service.Calculate(order);

        Assert.Equal(expected, result.Rate);
    }

    [Fact]
    public void Calculate_KhachVip_CongThemBaPhanTram()
    {
        var order = new Order { Total = 600_000, Customer = new Customer { IsVip = true } };

        var result = _service.Calculate(order);

        Assert.Equal(0.08m, result.Rate);
    }

    [Fact]
    public void Calculate_VipDonLon_KhongVuotTranMuoiLamPhanTram()
    {
        var order = new Order { Total = 10_000_000, Customer = new Customer { IsVip = true } };

        var result = _service.Calculate(order);

        Assert.Equal(0.13m, result.Rate);
        Assert.True(result.Rate <= 0.15m);
    }

    [Fact]
    public void Calculate_DonBangKhong_KhongGiam()
    {
        var order = new Order { Total = 0, Customer = new Customer { IsVip = true } };

        var result = _service.Calculate(order);

        Assert.Equal(0.03m, result.Rate);
    }
}`
},
{
  id: 'net-23', lang: 'dotnet', level: 'Nâng cao', topic: 'Kiểm thử',
  title: 'Integration test với WebApplicationFactory',
  io: {
    given: `public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    // Bạn viết ConfigureWebHost để thay database thật bằng database test
}

public record CreateProductDto(string Name, decimal Price, string Sku);

// API đang test:
//   GET  /api/products        công khai
//   GET  /api/products/{id}   công khai, trả 404 khi không có
//   POST /api/products        yêu cầu token, trả 400 khi dto sai
// AppDbContext đang được đăng ký bằng AddDbContext<AppDbContext>(...UseNpgsql...)`
  },
  brief: `<p>Viết integration test cho <code>ProductsController</code> dùng <code>WebApplicationFactory</code>.</p>
<ul>
<li>Thay database thật bằng database test (in-memory hoặc SQLite in-memory)</li>
<li>Test 1: <code>GET /api/products</code> trả 200</li>
<li>Test 2: <code>POST /api/products</code> không có token trả 401</li>
<li>Test 3: <code>POST /api/products</code> với dữ liệu sai trả 400 kèm chi tiết lỗi</li>
<li>Test 4: <code>GET /api/products/999</code> trả 404</li>
<li>Mỗi test chạy trên dữ liệu sạch, không phụ thuộc thứ tự chạy</li>
</ul>`,
  starter: `public class ProductsApiTests : IClassFixture<CustomWebApplicationFactory>
{
    // Viết test ở đây
}

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Thay DbContext ở đây
    }
}`,
  hints: ['services.RemoveAll<DbContextOptions<AppDbContext>>() trước khi đăng ký lại.', 'SQLite in-memory giữ hành vi gần database thật hơn InMemory provider.', 'Program cần là public — thêm public partial class Program { } ở cuối Program.cs.'],
  rubric: [
    'CustomWebApplicationFactory thay được DbContext bằng database test',
    'Có gỡ đăng ký DbContextOptions cũ trước khi thêm cái mới',
    'Đủ bốn test theo yêu cầu',
    'Test 401 không gắn token, test khác gắn token khi cần',
    'Mỗi test làm sạch hoặc tạo dữ liệu riêng',
    'Dùng CreateClient() và các phương thức async của HttpClient',
    'Có nhắc tới việc Program phải khai báo public partial'
  ],
  solution: `public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();

            var connection = new SqliteConnection("DataSource=:memory:");
            connection.Open();
            services.AddSingleton(connection);
            services.AddDbContext<AppDbContext>(o => o.UseSqlite(connection));

            using var scope = services.BuildServiceProvider().CreateScope();
            scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.EnsureCreated();
        });
    }
}

public class ProductsApiTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task GetAll_TraVe200()
    {
        var client = factory.CreateClient();
        var res = await client.GetAsync("/api/products");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    [Fact]
    public async Task Create_KhongCoToken_TraVe401()
    {
        var client = factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/products",
            new { name = "Sách", price = 100000m, sku = "ABC-1234", categoryId = 1 });
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Create_DuLieuSai_TraVe400KemChiTiet()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", TestTokens.Admin);

        var res = await client.PostAsJsonAsync("/api/products",
            new { name = "x", price = -5m, sku = "sai", categoryId = 0 });

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var problem = await res.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(problem);
        Assert.NotEmpty(problem!.Errors);
    }

    [Fact]
    public async Task GetById_KhongTonTai_TraVe404()
    {
        var client = factory.CreateClient();
        var res = await client.GetAsync("/api/products/999");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }
}

// Cuối Program.cs: public partial class Program { }`
},
{
  id: 'net-24', lang: 'dotnet', level: 'Trung bình', topic: 'EF Core',
  title: 'Migration và seed dữ liệu',
  io: {
    given: `// Category: Id, Name
// User:     Id, Email, FullName, PasswordHash, Roles (List<string>)

// Tiêm vào DatabaseSeeder qua tham số: AppDbContext db,
//   IPasswordHasher<User> hasher, IConfiguration config
// Mật khẩu admin nằm ở config["Seed:AdminPassword"]

// Bạn viết: Task SeedAsync(...) và phần gọi nó trong Program.cs
// (chỉ chạy migration tự động khi app.Environment.IsDevelopment()).`
  },
  brief: `<p>Viết phần seed dữ liệu ban đầu cho ứng dụng:</p>
<ul>
<li>Ba danh mục mặc định và một tài khoản admin</li>
<li>Seed phải <strong>idempotent</strong>: chạy lại nhiều lần không tạo dữ liệu trùng</li>
<li>Migration chạy tự động khi khởi động ở môi trường Development, nhưng <strong>không</strong> ở Production</li>
<li>Mật khẩu admin lấy từ cấu hình, không viết cứng trong code</li>
</ul>
<p>Liệt kê các lệnh <code>dotnet ef</code> cần dùng.</p>`,
  starter: `public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        // Viết code ở đây
    }
}

// Program.cs — gọi seed

// Lệnh dotnet ef:`,
  hints: ['Kiểm tra AnyAsync() trước khi thêm để seed chạy lại được.', 'db.Database.MigrateAsync() áp dụng migration còn thiếu.', 'Ở Production nên chạy migration trong bước deploy, không trong ứng dụng.'],
  rubric: [
    'Seed kiểm tra dữ liệu đã tồn tại trước khi thêm (idempotent)',
    'Mật khẩu admin đọc từ IConfiguration, không viết cứng',
    'Mật khẩu được băm, không lưu thô',
    'MigrateAsync chỉ gọi ở môi trường Development',
    'Tạo scope đúng cách để lấy DbContext',
    'Liệt kê đúng lệnh dotnet ef migrations add và dotnet ef database update',
    'Có giải thích vì sao không tự chạy migration ở Production'
  ],
  solution: `public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var db = sp.GetRequiredService<AppDbContext>();
        var config = sp.GetRequiredService<IConfiguration>();
        var hasher = sp.GetRequiredService<IPasswordHasher<User>>();

        if (!await db.Categories.AnyAsync())
        {
            db.Categories.AddRange(
                new Category { Name = "Sách" },
                new Category { Name = "Điện tử" },
                new Category { Name = "Gia dụng" });
        }

        const string adminEmail = "admin@shop.local";
        if (!await db.Users.AnyAsync(u => u.Email == adminEmail))
        {
            var password = config["Seed:AdminPassword"]
                ?? throw new InvalidOperationException("Thiếu cấu hình Seed:AdminPassword");

            var admin = new User { Email = adminEmail, FullName = "Quản trị", Roles = ["Admin"] };
            admin.PasswordHash = hasher.HashPassword(admin, password);
            db.Users.Add(admin);
        }

        await db.SaveChangesAsync();
    }
}

// Program.cs
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
}
await DatabaseSeeder.SeedAsync(app.Services);

// Lệnh:
//   dotnet ef migrations add InitialCreate
//   dotnet ef database update
//   dotnet ef migrations remove        (huỷ migration chưa áp dụng)
//   dotnet ef migrations script        (sinh SQL cho bước deploy Production)
//
// Ở Production, migration nên chạy như một bước riêng trong pipeline deploy:
// nhiều bản sao ứng dụng khởi động cùng lúc sẽ tranh nhau chạy migration.`
},
{
  id: 'net-25', lang: 'dotnet', level: 'Cơ bản', topic: 'Cấu hình',
  title: 'CORS và cấu hình theo môi trường',
  io: {
    given: `// appsettings.Production.json đã có:
// "Cors": { "AllowedOrigins": [ "https://shop.example.com" ] }

// Bạn viết trong Program.cs: builder.Services.AddCors(...) với policy khác nhau
// theo builder.Environment, và app.UseCors(...) đặt đúng chỗ trong pipeline.`
  },
  brief: `<p>Cấu hình CORS đúng cách cho hai môi trường:</p>
<ul>
<li>Development: cho phép <code>http://localhost:5173</code> và <code>http://localhost:3000</code></li>
<li>Production: chỉ cho phép danh sách origin đọc từ <code>appsettings.Production.json</code></li>
<li>Cho phép gửi cookie (credentials)</li>
<li>Không bao giờ dùng <code>AllowAnyOrigin</code> ở Production</li>
</ul>
<p>Giải thích vì sao <code>AllowAnyOrigin</code> và <code>AllowCredentials</code> không dùng chung được.</p>`,
  starter: `// Program.cs

// Giải thích:`,
  hints: ['Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() đọc mảng từ JSON.', 'UseCors phải đứng trước UseAuthentication và UseAuthorization.', 'Đặc tả CORS cấm kết hợp wildcard origin với credentials.'],
  rubric: [
    'Origin cho Development và Production khác nhau',
    'Danh sách origin Production đọc từ cấu hình, không viết cứng',
    'Có AllowCredentials và WithOrigins cụ thể',
    'Không dùng AllowAnyOrigin ở Production',
    'app.UseCors() đặt trước UseAuthentication/UseAuthorization',
    'Giải thích được rằng trình duyệt từ chối phản hồi có Access-Control-Allow-Origin: * khi request gửi kèm credentials'
  ],
  solution: `// Program.cs
const string CorsPolicy = "app-cors";

builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        var origins = builder.Environment.IsDevelopment()
            ? ["http://localhost:5173", "http://localhost:3000"]
            : builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
              ?? throw new InvalidOperationException("Thiếu cấu hình Cors:AllowedOrigins");

        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });
});

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

// appsettings.Production.json
// { "Cors": { "AllowedOrigins": ["https://shop.example.com"] } }

// AllowAnyOrigin sinh header Access-Control-Allow-Origin: *.
// Đặc tả CORS quy định trình duyệt phải từ chối phản hồi đó khi request
// gửi kèm credentials (cookie, Authorization) — nếu không, bất kỳ trang web nào
// cũng đọc được dữ liệu của người dùng đang đăng nhập.`
}
];
