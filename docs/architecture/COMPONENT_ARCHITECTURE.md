# VANTORIS Component Architecture

## Overview

The VANTORIS component architecture establishes a reusable, composable system for building consistent, accessible, and performant user interfaces across all member-facing and administrative applications. Components are organized hierarchically from foundational primitives through composite modules, following React best practices and accessibility standards.

## Design Principles

### 1. Composition Over Inheritance
- Build complex UIs by combining simple, single-purpose components
- Avoid deep component hierarchies and prop drilling
- Use render props and compound components for flexibility

### 2. Single Responsibility
- Each component has one primary purpose
- Props are minimal and intentional
- Complex logic extracted to hooks or services

### 3. Accessibility First
- WCAG 2.1 AA compliance by default
- Semantic HTML, ARIA labels, keyboard navigation
- Color contrast ratios meet accessibility standards
- Screen reader tested and optimized

### 4. Performance Optimized
- Memoization for expensive renders
- Lazy loading for large component trees
- Virtual scrolling for long lists
- Code splitting at route and module boundaries

### 5. Type Safe
- Full TypeScript coverage with no `any` types
- Props interfaces explicitly defined
- Discriminated unions for variant management
- Generic constraints for reusable patterns

### 6. Responsive by Default
- Mobile-first approach
- Fluid typography and spacing
- Breakpoint system using Tailwind CSS
- Touch-friendly interactive elements (min 48px targets)

### 7. Testable Architecture
- Pure, deterministic components
- Hooks for business logic isolation
- Mock providers for dependencies
- Semantic queries in tests (not implementation details)

### 8. Design Token Integration
- All visual properties sourced from design tokens
- No hardcoded colors, sizes, or typography
- Themeable and maintainable at scale

## Component Hierarchy

```
Foundation Layer (Primitives)
├── Typography
│   ├── Heading (H1-H6)
│   ├── Body Text
│   ├── Caption
│   └── Code
├── Layout
│   ├── Box
│   ├── Flex
│   ├── Grid
│   ├── Stack (Vertical/Horizontal)
│   └── Spacer
├── Surfaces
│   ├── Card
│   ├── Panel
│   ├── Sheet
│   └── Modal
└── Media
    ├── Image
    ├── Icon
    └── Avatar

Input Layer
├── Forms
│   ├── TextInput
│   ├── NumberInput
│   ├── CurrencyInput
│   ├── PhoneInput
│   ├── EmailInput
│   ├── PasswordInput
│   ├── DatePicker
│   ├── TimePicker
│   ├── Select
│   ├── MultiSelect
│   ├── Checkbox
│   ├── Radio
│   ├── Toggle
│   ├── FileUpload
│   ├── Textarea
│   └── FormGroup
├── Buttons
│   ├── Button
│   ├── IconButton
│   ├── ButtonGroup
│   └── SplitButton
└── Controls
    ├── Slider
    ├── Stepper
    ├── TabGroup
    └── Accordion

Feedback Layer
├── Alerts
│   ├── InfoAlert
│   ├── SuccessAlert
│   ├── WarningAlert
│   ├── ErrorAlert
│   └── AlertDialog
├── Notifications
│   ├── Toast
│   ├── Snackbar
│   └── Toaster
├── Loading States
│   ├── Skeleton
│   ├── Spinner
│   ├── ProgressBar
│   ├── LinearProgress
│   └── CircularProgress
└── Empty States
    ├── EmptyState
    ├── ErrorState
    └── ErrorBoundary

Navigation Layer
├── Navigation
│   ├── Navbar
│   ├── Sidebar
│   ├── Breadcrumbs
│   ├── Pagination
│   ├── Stepper
│   └── TabNavigation
├── Menu
│   ├── Dropdown
│   ├── ContextMenu
│   └── CommandPalette
└── Bottom Navigation
    ├── BottomNav (5 tabs)
    ├── BottomNavItem
    └── FloatingActionButton

Data Display Layer
├── Tables
│   ├── DataTable
│   ├── TableHeader
│   ├── TableRow
│   ├── TableCell
│   ├── SortableColumn
│   ├── FilterableColumn
│   ├── SelectableRow
│   └── ExpandableRow
├── Lists
│   ├── List
│   ├── ListItem
│   ├── VirtualList (for large datasets)
│   └── InfiniteScrollList
├── Charts
│   ├── LineChart
│   ├── AreaChart
│   ├── BarChart
│   ├── PieChart
│   ├── DoughnutChart
│   ├── CandlestickChart
│   └── CustomChart
└── Cards
    ├── AccountCard
    ├── TransactionCard
    ├── PortfolioCard
    ├── CryptoCard
    ├── InsightCard
    └── MetricCard

Domain-Specific Layer (Banking)
├── Account Components
│   ├── AccountSelector
│   ├── AccountBalance
│   ├── AccountDetails
│   ├── AccountHistory
│   └── AccountSettings
├── Transfer Components
│   ├── TransferForm
│   ├── RecipientSelector
│   ├── TransferReview
│   ├── TransferConfirmation
│   └── TransferStatus
├── Card Components
│   ├── CardDisplay
│   ├── CardControls
│   ├── CardSettings
│   ├── CardLimits
│   └── CVVDisplay
├── Investment Components
│   ├── PortfolioOverview
│   ├── PositionCard
│   ├── OrderForm
│   ├── OrderReview
│   ├── MarketChart
│   └── WatchlistItem
├── Crypto Components
│   ├── CryptoWallet
│   ├── CryptoBalance
│   ├── TradeForm
│   ├── TransactionHistory
│   └── MarketData
├── Chat Components
│   ├── ChatContainer
│   ├── ChatMessage
│   ├── ChatInput
│   ├── AttachmentUpload
│   ├── MediaPreview
│   ├── ReactionPicker
│   ├── ChatActions
│   ├── TypingIndicator
│   └── ReadReceipts
└── Admin Components
    ├── TransactionMonitor
    ├── RiskDashboard
    ├── ComplianceMatrix
    ├── UserManagement
    ├── PermissionMatrix
    └── AuditLog

Specialized Layer (AI & Advisory)
├── AI Assistant
│   ├── AssistantChat
│   ├── AssistantMessage
│   ├── AssistantSuggestions
│   ├── AssistantActions
│   └── AssistantContext
├── Messaging
│   ├── MessageThread
│   ├── MessageList
│   ├── MessageComposer
│   ├── RichTextEditor
│   └── CommandBar
└── Onboarding
    ├── OnboardingWizard
    ├── OnboardingStep
    ├── ProgressIndicator
    ├── KYCForm
    ├── DocumentUpload
    └── VerificationStatus
```

## Foundation Components

### Typography System

```typescript
// Heading component with responsive sizing
<Heading level={1} as="h1" responsive>
  Account Overview
</Heading>

// Body text with semantic meaning
<Text variant="body-lg" color="text-primary">
  Your available balance
</Text>

// Caption for supplementary information
<Text variant="caption" color="text-secondary">
  Updated 2 minutes ago
</Text>
```

### Layout System

```typescript
// Flex layout for direction and alignment control
<Flex direction="column" gap="md" align="center">
  <Text>Balance</Text>
  <Heading>$50,000.00</Heading>
</Flex>

// Grid layout for 2D positioning
<Grid columns={{ base: 1, md: 2, lg: 3 }} gap="lg">
  <AccountCard />
  <AccountCard />
  <AccountCard />
</Grid>

// Stack (vertical spacing abstraction)
<Stack gap="md">
  <TransactionCard />
  <TransactionCard />
  <TransactionCard />
</Stack>
```

### Surface Components

```typescript
// Card: Foundation for grouped content
<Card variant="elevated" interactive>
  <Card.Header>
    <Heading level={3}>Recent Transactions</Heading>
  </Card.Header>
  <Card.Body>
    <TransactionList />
  </Card.Body>
  <Card.Footer>
    <Link href="/transactions">View All</Link>
  </Card.Footer>
</Card>

// Modal: Focused user attention
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>Confirm Transfer</Modal.Header>
  <Modal.Body>
    <TransferReview transfer={transfer} />
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={onClose}>
      Cancel
    </Button>
    <Button onClick={handleConfirm}>Confirm</Button>
  </Modal.Footer>
</Modal>

// Sheet: Overlay panel, typically from edge
<Sheet isOpen={isOpen} onClose={onClose} side="right">
  <Sheet.Header>Settings</Sheet.Header>
  <Sheet.Body>
    <SettingsPanel />
  </Sheet.Body>
</Sheet>
```

## Input Components

### Form Components

```typescript
// Text input with validation
<FormGroup>
  <Label htmlFor="email">Email Address</Label>
  <TextInput
    id="email"
    type="email"
    placeholder="your@email.com"
    validation={emailValidation}
    errorMessage="Invalid email format"
    required
  />
  <HelperText>We'll never share your email</HelperText>
</FormGroup>

// Currency input for financial data
<FormGroup>
  <Label htmlFor="amount">Transfer Amount</Label>
  <CurrencyInput
    id="amount"
    currency="USD"
    min={0.01}
    max={accountBalance}
    placeholder="$0.00"
    required
  />
</FormGroup>

// Date picker with validation
<FormGroup>
  <Label htmlFor="date">Transaction Date</Label>
  <DatePicker
    id="date"
    minDate={subDays(new Date(), 90)}
    maxDate={new Date()}
    required
  />
</FormGroup>

// Select dropdown
<FormGroup>
  <Label htmlFor="account">From Account</Label>
  <Select id="account" required>
    {accounts.map(account => (
      <option key={account.id} value={account.id}>
        {account.name} - {formatCurrency(account.balance)}
      </option>
    ))}
  </Select>
</FormGroup>

// Checkbox group
<FormGroup>
  <Legend>Notification Preferences</Legend>
  <Checkbox name="email" defaultChecked>
    Email notifications
  </Checkbox>
  <Checkbox name="sms">
    SMS notifications
  </Checkbox>
  <Checkbox name="push">
    Push notifications
  </Checkbox>
</FormGroup>

// File upload with drag-and-drop
<FormGroup>
  <Label>Upload Document</Label>
  <FileUpload
    accept=".pdf,.docx,.xlsx,.jpg,.png"
    maxSize={10 * 1024 * 1024}
    multiple
    onDrop={handleDrop}
  />
  <HelperText>Max 10MB, supported formats: PDF, DOCX, XLSX, JPG, PNG</HelperText>
</FormGroup>
```

### Button Components

```typescript
// Primary button for main actions
<Button variant="primary" size="lg" onClick={handleSubmit}>
  Confirm Transfer
</Button>

// Secondary button for alternative actions
<Button variant="secondary" onClick={handleCancel}>
  Cancel
</Button>

// Icon button for compact UI
<IconButton icon="settings" aria-label="Settings" onClick={openSettings} />

// Button group for related actions
<ButtonGroup>
  <Button variant="secondary">Save Draft</Button>
  <Button variant="primary">Send</Button>
</ButtonGroup>
```

## Navigation Components

### Bottom Navigation (Member App)

```typescript
// Bottom navigation: exactly 5 tabs
<BottomNav activeTab={activeTab} onChange={setActiveTab}>
  <BottomNavItem icon="home" label="Home" value="home" />
  <BottomNavItem icon="accounts" label="Accounts" value="accounts" />
  <BottomNavItem icon="transfer" label="Move Money" value="move-money" />
  <BottomNavItem icon="investment" label="Investments" value="investments" />
  <BottomNavItem icon="more" label="More" value="more" />
</BottomNav>

// Floating action button (separate from navigation)
<FloatingActionButton icon="plus" onClick={openCommandMenu} />
```

### Top Navigation

```typescript
// Navigation bar for web applications
<Navbar>
  <Navbar.Brand>VANTORIS</Navbar.Brand>
  <Navbar.Nav>
    <NavLink href="/dashboard" active>Dashboard</NavLink>
    <NavLink href="/accounts">Accounts</NavLink>
    <NavLink href="/transfers">Transfers</NavLink>
  </Navbar.Nav>
  <Navbar.Right>
    <IconButton icon="notifications" badge={3} />
    <Avatar user={currentUser} />
  </Navbar.Right>
</Navbar>

// Breadcrumbs for navigation context
<Breadcrumbs>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/accounts">Accounts</BreadcrumbItem>
  <BreadcrumbItem current>Checking Account</BreadcrumbItem>
</Breadcrumbs>
```

## Data Display Components

### Tables

```typescript
// Data table with sorting, filtering, selection
<DataTable
  columns={[
    {
      header: 'Date',
      accessorKey: 'date',
      cell: (date) => format(new Date(date), 'MMM d, yyyy'),
      sortable: true,
    },
    {
      header: 'Description',
      accessorKey: 'description',
      filterable: true,
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (amount) => formatCurrency(amount),
      align: 'right',
      sortable: true,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (status) => <StatusBadge status={status} />,
      filterable: true,
    },
  ]}
  data={transactions}
  selectable
  onSelectionChange={setSelected}
  pagination
  pageSize={20}
/>
```

### Charts

```typescript
// Line chart for trend visualization
<LineChart data={balanceHistory} height={300}>
  <XAxis dataKey="date" />
  <YAxis />
  <CartesianGrid strokeDasharray="3 3" />
  <Tooltip formatter={formatCurrency} />
  <Line 
    dataKey="balance" 
    stroke="var(--color-primary)" 
    dot={false}
  />
</LineChart>

// Bar chart for comparison
<BarChart data={monthlyExpenses} height={300}>
  <XAxis dataKey="month" />
  <YAxis />
  <CartesianGrid strokeDasharray="3 3" />
  <Tooltip formatter={formatCurrency} />
  <Bar dataKey="amount" fill="var(--color-primary)" />
</BarChart>
```

## Banking Domain Components

### Account Components

```typescript
// Account card: Primary account display
<AccountCard
  account={account}
  balance={balance}
  interactive
  onClick={() => navigate(`/accounts/${account.id}`)}
>
  <AccountCard.Header>
    <AccountCard.Name>{account.name}</AccountCard.Name>
    <AccountCard.Type>{account.type}</AccountCard.Type>
  </AccountCard.Header>
  <AccountCard.Body>
    <AccountCard.Balance>{formatCurrency(balance)}</AccountCard.Balance>
  </AccountCard.Body>
  <AccountCard.Actions>
    <IconButton icon="transfer" aria-label="Transfer funds" />
    <IconButton icon="more" aria-label="More options" />
  </AccountCard.Actions>
</AccountCard>

// Account selector: Choose account for operations
<AccountSelector
  accounts={accounts}
  selectedId={selectedAccountId}
  onChange={setSelectedAccountId}
/>

// Account balance with real-time updates
<AccountBalance
  accountId={accountId}
  format="detailed"
  lastUpdated
/>
```

### Transfer Components

```typescript
// Transfer form: Guided transfer creation
<TransferForm
  fromAccounts={accounts}
  onSubmit={handleTransferSubmit}
>
  <TransferForm.Step label="Select Account">
    <AccountSelector />
  </TransferForm.Step>
  
  <TransferForm.Step label="Recipient">
    <RecipientSelector />
  </TransferForm.Step>
  
  <TransferForm.Step label="Amount">
    <CurrencyInput />
  </TransferForm.Step>
  
  <TransferForm.Step label="Confirmation">
    <TransferReview />
  </TransferForm.Step>
</TransferForm>

// Transfer confirmation: Rich feedback
<TransferConfirmation
  transfer={transfer}
  status="success"
  referenceNumber={refNum}
  estimatedDelivery={deliveryDate}
/>
```

### Crypto Components

```typescript
// Crypto balance card: Portfolio overview
<CryptoCard
  currency="bitcoin"
  balance={btcBalance}
  value={usdValue}
  change24h={percentChange}
  onClick={() => navigate('/crypto/bitcoin')}
/>

// Trade form: Buy/sell crypto
<TradeForm
  asset="ethereum"
  onSubmit={handleTrade}
  maxAmount={accountBalance}
>
  <TradeForm.Type tradeType={tradeType} onChange={setTradeType} />
  <TradeForm.Amount />
  <TradeForm.Price />
  <TradeForm.Total />
  <TradeForm.Review />
</TradeForm>
```

## Chat Components

### Messaging

```typescript
// Chat container: Complete messaging interface
<ChatContainer>
  <ChatHeader>
    <Avatar user={advisor} />
    <Flex direction="column" flex={1}>
      <Text weight="semibold">{advisor.name}</Text>
      <TypingIndicator isActive={isTyping} />
    </Flex>
    <IconButton icon="info" onClick={openAdvisorInfo} />
  </ChatHeader>
  
  <ChatMessageList
    messages={messages}
    currentUserId={currentUser.id}
    virtualScroll
    infiniteScroll
    onLoadMore={loadMoreMessages}
  />
  
  <ChatInputBar
    onSendMessage={handleSendMessage}
    onSendFile={handleSendFile}
    onSendMedia={handleSendMedia}
    placeholder="Ask me anything about your finances..."
  >
    <AttachmentButton />
    <CameraButton />
    <LocationButton />
  </ChatInputBar>
</ChatContainer>

// Chat message: Individual message with actions
<ChatMessage
  message={message}
  isCurrentUser={isCurrentUser}
  showAvatar={showAvatar}
  onReaction={handleReaction}
  onReply={handleReply}
  onDelete={handleDelete}
  onEdit={handleEdit}
>
  {message.text}
  {message.attachments && <AttachmentPreview attachments={message.attachments} />}
</ChatMessage>

// Chat input with rich features
<ChatInput
  onSendMessage={handleSend}
  onAttach={handleAttach}
  onEmojiClick={handleEmoji}
  placeholder="Type a message..."
  autoGrow
  maxRows={5}
>
  <RichTextToolbar />
  <MentionSuggestions />
</ChatInput>

// Message attachment preview
<AttachmentPreview
  attachment={attachment}
  type={attachment.type}
>
  {attachment.type === 'image' && <ImagePreview src={attachment.url} />}
  {attachment.type === 'video' && <VideoPreview src={attachment.url} />}
  {attachment.type === 'pdf' && <DocumentPreview src={attachment.url} />}
  {attachment.type === 'audio' && <AudioPlayer src={attachment.url} />}
</AttachmentPreview>
```

## AI Assistant Components

```typescript
// AI assistant: Member Advisor interface
<AIAssistant>
  <AIAssistant.Header>
    <Heading level={2}>Member Advisor</Heading>
    <Text color="text-secondary">Your financial AI assistant</Text>
  </AIAssistant.Header>
  
  <ChatMessageList
    messages={conversationHistory}
    currentUserId="member"
  />
  
  <AIAssistant.Suggestions>
    {suggestions.map(suggestion => (
      <SuggestionCard
        key={suggestion.id}
        suggestion={suggestion}
        onClick={() => handleSuggestionClick(suggestion)}
      />
    ))}
  </AIAssistant.Suggestions>
  
  <ChatInput onSendMessage={handleMessage} />
</AIAssistant>

// AI suggestion card: Actionable insight
<SuggestionCard
  icon="lightbulb"
  title={suggestion.title}
  description={suggestion.description}
  action={suggestion.action}
  onClick={handleClick}
/>
```

## Onboarding Components

```typescript
// Onboarding wizard: Multi-step registration
<OnboardingWizard
  steps={onboardingSteps}
  currentStep={currentStep}
  onStepChange={setCurrentStep}
  onComplete={handleOnboardingComplete}
>
  <OnboardingStep title="Phone Verification" index={0}>
    <PhoneVerificationForm onSubmit={handlePhoneSubmit} />
  </OnboardingStep>
  
  <OnboardingStep title="Personal Information" index={1}>
    <PersonalInfoForm onSubmit={handlePersonalSubmit} />
  </OnboardingStep>
  
  <OnboardingStep title="Identity Verification" index={2}>
    <KYCForm onSubmit={handleKYCSubmit} />
  </OnboardingStep>
  
  <OnboardingStep title="Password & Security" index={3}>
    <SecuritySetupForm onSubmit={handleSecuritySubmit} />
  </OnboardingStep>
  
  <OnboardingStep title="Success" index={4}>
    <SuccessScreen message="Account created successfully!" />
  </OnboardingStep>
</OnboardingWizard>

// Progress indicator: Visual step tracking
<ProgressIndicator
  currentStep={currentStep}
  totalSteps={totalSteps}
  labels={stepLabels}
/>
```

## Feedback Components

### Alerts & Notifications

```typescript
// Alert: Static messaging
<Alert variant="info" title="Account Verified">
  Your identity has been successfully verified.
</Alert>

<Alert variant="success" title="Transfer Complete">
  Your transfer of $500 has been sent to John Doe.
</Alert>

<Alert variant="warning" title="Unusual Activity">
  We detected a login from a new device.
</Alert>

<Alert variant="error" title="Transfer Failed">
  The transfer could not be completed. Please try again.
</Alert>

// Toast: Temporary notification
toast.success('Transfer completed successfully', {
  duration: 3000,
  action: { label: 'Undo', onClick: handleUndo }
})

// Modal alert: Requires user action
<AlertDialog
  title="Confirm Device Removal"
  description="Are you sure you want to remove this device?"
  isOpen={isOpen}
  onClose={onClose}
>
  <Button variant="secondary" onClick={onClose}>
    Cancel
  </Button>
  <Button variant="danger" onClick={handleRemove}>
    Remove Device
  </Button>
</AlertDialog>
```

### Loading & Empty States

```typescript
// Skeleton: Placeholder during load
<Skeleton variant="card" count={3} height={120} />

// Spinner: Loading indicator
<Spinner size="lg" />

// Empty state: No data available
<EmptyState
  icon="inbox"
  title="No Transactions"
  description="You haven't made any transactions yet."
  action={
    <Button onClick={() => navigate('/transfer')}>
      Make a Transfer
    </Button>
  }
/>

// Error state: Operation failed
<ErrorState
  icon="alert"
  title="Failed to Load Transactions"
  description="Please check your connection and try again."
  action={
    <Button onClick={handleRetry}>
      Retry
    </Button>
  }
/>
```

## Accessibility Standards

### Semantic HTML
- Use semantic elements: `<button>`, `<input>`, `<nav>`, `<header>`, `<main>`, `<footer>`
- Never div soup; use appropriate elements for meaning
- `<label htmlFor>` for form inputs

### ARIA Implementation
```typescript
// Buttons
<button aria-label="Close dialog" onClick={close}>
  ×
</button>

// Regions
<main role="main" aria-label="Member dashboard">
  ...
</main>

// Live regions for notifications
<div role="status" aria-live="polite" aria-atomic="true">
  Transfer completed successfully
</div>

// Icon buttons need labels
<IconButton icon="menu" aria-label="Open navigation" />

// Modal dialogs
<dialog aria-labelledby="modal-title" aria-describedby="modal-desc">
  <h2 id="modal-title">Confirm Transfer</h2>
  <p id="modal-desc">Review the details before confirming</p>
</dialog>
```

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Tab order reflects logical flow
- `Escape` key closes modals and dropdowns
- Arrow keys navigate lists and tabs
- `Enter` activates buttons
- Focus visible with high contrast outline

### Color & Contrast
- Minimum 4.5:1 ratio for normal text
- Minimum 3:1 ratio for large text
- Don't use color alone to convey information
- Support high contrast mode

## Responsive Behavior

### Breakpoints
```typescript
const breakpoints = {
  xs: '0px',      // Mobile: 360px+
  sm: '640px',    // Tablet small: 640px+
  md: '768px',    // Tablet: 768px+
  lg: '1024px',   // Desktop: 1024px+
  xl: '1280px',   // Large desktop: 1280px+
  '2xl': '1536px' // Extra large: 1536px+
}
```

### Responsive Patterns
```typescript
// Responsive grid
<Grid
  columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
  gap={{ base: 'sm', md: 'lg' }}
>
  {items.map(item => <AccountCard key={item.id} {...item} />)}
</Grid>

// Responsive text
<Heading
  level={1}
  size={{ base: 'lg', md: 'xl', lg: '2xl' }}
>
  Account Overview
</Heading>

// Hide/show at breakpoints
<Box display={{ base: 'none', md: 'block' }}>
  Sidebar (hidden on mobile)
</Box>

<Box display={{ base: 'block', md: 'none' }}>
  Mobile menu
</Box>
```

## Component Folder Structure

```
src/
├── components/
│   ├── foundation/
│   │   ├── Typography.tsx
│   │   ├── Layout.tsx
│   │   ├── Surface.tsx
│   │   ├── Media.tsx
│   │   └── index.ts
│   ├── input/
│   │   ├── Form/
│   │   │   ├── TextInput.tsx
│   │   │   ├── CurrencyInput.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── index.ts
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── IconButton.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── feedback/
│   │   ├── Alert/
│   │   │   ├── Alert.tsx
│   │   │   ├── AlertDialog.tsx
│   │   │   └── index.ts
│   │   ├── Notification/
│   │   │   ├── Toast.tsx
│   │   │   └── index.ts
│   │   ├── Loading/
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── navigation/
│   │   ├── Navbar.tsx
│   │   ├── BottomNav.tsx
│   │   ├── Breadcrumbs.tsx
│   │   ├── Sidebar.tsx
│   │   └── index.ts
│   ├── data-display/
│   │   ├── Table/
│   │   │   ├── DataTable.tsx
│   │   │   ├── TableHeader.tsx
│   │   │   ├── TableRow.tsx
│   │   │   └── index.ts
│   │   ├── List/
│   │   │   ├── List.tsx
│   │   │   ├── ListItem.tsx
│   │   │   ├── VirtualList.tsx
│   │   │   └── index.ts
│   │   ├── Chart/
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── PieChart.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── domain/
│   │   ├── Account/
│   │   │   ├── AccountCard.tsx
│   │   │   ├── AccountSelector.tsx
│   │   │   ├── AccountBalance.tsx
│   │   │   └── index.ts
│   │   ├── Transfer/
│   │   │   ├── TransferForm.tsx
│   │   │   ├── TransferReview.tsx
│   │   │   ├── TransferConfirmation.tsx
│   │   │   └── index.ts
│   │   ├── Card/
│   │   │   ├── CardDisplay.tsx
│   │   │   ├── CardControls.tsx
│   │   │   └── index.ts
│   │   ├── Investment/
│   │   │   ├── PortfolioOverview.tsx
│   │   │   ├── OrderForm.tsx
│   │   │   └── index.ts
│   │   ├── Crypto/
│   │   │   ├── CryptoCard.tsx
│   │   │   ├── TradeForm.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── chat/
│   │   ├── ChatContainer.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── AttachmentPreview.tsx
│   │   ├── MediaPreview.tsx
│   │   └── index.ts
│   ├── ai/
│   │   ├── AIAssistant.tsx
│   │   ├── SuggestionCard.tsx
│   │   └── index.ts
│   ├── onboarding/
│   │   ├── OnboardingWizard.tsx
│   │   ├── OnboardingStep.tsx
│   │   ├── ProgressIndicator.tsx
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   ├── useForm.ts
│   ├── useLocalStorage.ts
│   ├── useMediaQuery.ts
│   ├── useAsyncEffect.ts
│   ├── useDebounce.ts
│   ├── usePrevious.ts
│   └── index.ts
├── types/
│   ├── component.ts
│   ├── domain.ts
│   └── index.ts
└── styles/
    ├── tokens.ts
    ├── tailwind.config.ts
    └── globals.css
```

## Component Development Guidelines

### TypeScript Definition
```typescript
interface ComponentProps {
  // Required props first
  children: React.ReactNode;
  // Optional props with defaults
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  // Event handlers
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  // Optional styling
  className?: string;
}

export const Component: React.FC<ComponentProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className,
}) => {
  // Component implementation
}
```

### Testing Pattern
```typescript
describe('Component', () => {
  it('renders with required props', () => {
    render(<Component>Content</Component>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Component onClick={handleClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })

  it('is accessible', () => {
    const { container } = render(<Component />)
    expect(container).toHaveNoViolations()
  })
})
```

## Design Token Integration

All components consume tokens from a centralized design system:

```typescript
// Colors
--color-primary: #0052CC
--color-success: #2D9D78
--color-warning: #F59E0B
--color-error: #DC2626

// Typography
--font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
--font-size-base: 16px
--line-height-base: 1.5

// Spacing
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px

// Shadows
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)

// Border Radius
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-full: 9999px
```

Components reference tokens instead of hardcoding values, enabling theme switching and consistency.

## Performance Optimization

### Memoization
```typescript
// Memoize expensive components
export const AccountCard = React.memo(
  ({ account, balance }: Props) => {
    return <Card>{/* content */}</Card>
  },
  (prev, next) => prev.account.id === next.account.id
)

// Memoize callbacks
const handleTransfer = useCallback(() => {
  // handler logic
}, [dependencies])
```

### Code Splitting
```typescript
// Lazy load modular features
const AIAssistant = React.lazy(() => import('./AIAssistant'))
const InvestmentPortal = React.lazy(() => import('./InvestmentPortal'))

// Suspense boundary with fallback
<Suspense fallback={<Skeleton />}>
  <AIAssistant />
</Suspense>
```

### Virtual Scrolling
```typescript
// Virtual scroll for large lists
<VirtualList
  items={transactions}
  itemHeight={80}
  height={600}
  renderItem={(transaction) => <TransactionRow {...transaction} />}
/>
```

## Integration with Base44

When Base44 source is exported:

1. **Component Audit**: Map existing Base44 components to this architecture
2. **Component Extraction**: Extract UI logic into reusable components
3. **Token Migration**: Extract design values into tokens
4. **Hook Extraction**: Convert complex logic to custom hooks
5. **Type Definition**: Add TypeScript types to all components
6. **Testing**: Add test coverage for all components
7. **Documentation**: Generate Storybook stories for each component
8. **Performance**: Apply memoization and code splitting patterns

This structure ensures components can be easily refactored and optimized during migration while maintaining functionality.
